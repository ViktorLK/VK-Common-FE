import { VKResult, VKError, createMutex, type VKTokenProvider } from '@vk-blocks/core';
import { VKAuthTokens } from '../types/auth.js';
import { VKAuthErrorCodes } from '../constants/errors.js';

export interface VKTokenManagerOptions {
  readonly initialTokens?: VKAuthTokens | null;
  readonly onRefresh?: (refreshToken: string) => Promise<VKResult<VKAuthTokens>>;
  readonly onSessionExpired?: () => void;
  readonly tokenRefreshThresholdMs?: number; // Defaults to 30s (30,000ms)
  readonly clockSkewMs?: number; // Clock drift tolerance, defaults to 0ms
}

/**
 * Enterprise Token Lifecycle & Concurrency-safe Refresh Mutex Manager.
 * Implements the VKTokenProvider SPI contract for HTTP and API transport layers.
 * Prevents race conditions and multiple duplicate refresh calls when concurrent requests hit 401s.
 */
export class VKTokenManager implements VKTokenProvider {
  private tokens: VKAuthTokens | null = null;
  private readonly onRefresh?: (refreshToken: string) => Promise<VKResult<VKAuthTokens>>;
  private readonly onSessionExpired?: () => void;
  private readonly tokenRefreshThresholdMs: number;
  private readonly clockSkewMs: number;
  private readonly mutex = createMutex();
  private refreshPromise: Promise<VKResult<VKAuthTokens>> | null = null;

  constructor(options: VKTokenManagerOptions = {}) {
    this.tokens = options.initialTokens ?? null;
    this.onRefresh = options.onRefresh;
    this.onSessionExpired = options.onSessionExpired;
    this.tokenRefreshThresholdMs = options.tokenRefreshThresholdMs ?? 30000;
    this.clockSkewMs = options.clockSkewMs ?? 0;
  }

  getTokens(): VKAuthTokens | null {
    return this.tokens;
  }

  setTokens(tokens: VKAuthTokens | null): void {
    this.tokens = tokens;
  }

  clearTokens(): void {
    this.tokens = null;
  }

  /**
   * Invalidates token cache per VKTokenProvider contract.
   */
  async invalidateToken(): Promise<void> {
    this.clearTokens();
  }

  /**
   * Checks if current access token is expired or within the proactive refresh threshold.
   * Takes configured clock drift skew into account.
   */
  isTokenExpiring(thresholdMs: number = this.tokenRefreshThresholdMs): boolean {
    if (!this.tokens?.expiresAt) {
      return false;
    }
    return Date.now() + thresholdMs + this.clockSkewMs >= this.tokens.expiresAt;
  }

  /**
   * Retrieves active access token per VKTokenProvider contract (CS.01/R-F4).
   * Performs proactive refresh if token is near expiration.
   */
  async getAccessToken(signal?: AbortSignal): Promise<VKResult<string | null>> {
    if (signal?.aborted) {
      return VKResult.failure(
        VKError.failure(VKAuthErrorCodes.TokenRequestAborted, 'Token acquisition was aborted.'),
      );
    }

    if (!this.tokens) {
      return VKResult.success(null);
    }

    if (this.tokens.refreshToken && this.isTokenExpiring()) {
      const refreshResult = await this.refreshToken(signal);
      if (refreshResult.isFailure) {
        return VKResult.failure(
          refreshResult.errors[0] ??
            VKError.unauthorized(VKAuthErrorCodes.TokenRefreshFailed, 'Failed to refresh access token.'),
        );
      }
      return VKResult.success(refreshResult.value.accessToken);
    }

    return VKResult.success(this.tokens.accessToken);
  }

  /**
   * Convenience helper returning raw token string or null.
   */
  async getRawToken(): Promise<string | null> {
    const res = await this.getAccessToken();
    return res.isSuccess ? res.value : null;
  }

  /**
   * Concurrency-safe token refresh.
   * If multiple requests trigger this concurrently, all await the same in-flight refresh promise.
   */
  async refreshToken(signal?: AbortSignal): Promise<VKResult<VKAuthTokens>> {
    if (signal?.aborted) {
      return VKResult.failure(
        VKError.failure(VKAuthErrorCodes.TokenRequestAborted, 'Token refresh was aborted.'),
      );
    }

    if (!this.tokens?.refreshToken) {
      this.clearTokens();
      this.onSessionExpired?.();
      return VKResult.failure(
        VKError.unauthorized(VKAuthErrorCodes.TokenNoRefreshToken, 'No refresh token available.'),
      );
    }

    if (!this.onRefresh) {
      return VKResult.failure(
        VKError.failure(VKAuthErrorCodes.TokenNoRefreshHandler, 'No refresh handler configured.'),
      );
    }

    // Coalesce concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.mutex.run(async () => {
      try {
        const currentRefreshToken = this.tokens?.refreshToken;
        if (!currentRefreshToken) {
          this.onSessionExpired?.();
          return VKResult.failure(
            VKError.unauthorized(VKAuthErrorCodes.TokenSessionExpired, 'Session has expired.'),
          );
        }

        const result = await this.onRefresh!(currentRefreshToken);

        if (result.isSuccess) {
          this.tokens = result.value;
          return result;
        } else {
          this.clearTokens();
          this.onSessionExpired?.();
          return result;
        }
      } finally {
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }

  /**
   * Attaches current Bearer access token to request headers.
   */
  async attachAuthorizationHeader(headers: Record<string, string> = {}): Promise<Record<string, string>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.isSuccess && tokenResult.value) {
      return {
        ...headers,
        Authorization: `Bearer ${tokenResult.value}`,
      };
    }
    return headers;
  }

  /**
   * Handles a 401 response by refreshing the token and retrying the failed operation.
   */
  async handleUnauthorized<T>(retryFn: (accessToken: string) => Promise<VKResult<T>>): Promise<VKResult<T>> {
    const refreshResult = await this.refreshToken();
    if (refreshResult.isFailure) {
      return VKResult.failure(
        refreshResult.errors[0] ??
          VKError.unauthorized(VKAuthErrorCodes.TokenUnauthorized, 'Unauthorized operation.'),
      );
    }

    return retryFn(refreshResult.value.accessToken);
  }
}
