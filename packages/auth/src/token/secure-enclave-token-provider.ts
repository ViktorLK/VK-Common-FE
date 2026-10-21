// [ARCH-02] [BASE-02] [OR.02] Encrypted / Keychain Enclave Token Provider
import { VKResult, VKVoidResult, VKError, createMutex, type VKTokenProvider } from '@vk-blocks/core';
import type { VKAuthTokens } from '../types/auth.js';
import { VKAuthErrorCodes } from '../constants/errors.js';

export interface IVKAsyncTokenStorage {
  readonly get: <T>(key: string) => Promise<VKResult<T>>;
  readonly set: <T>(key: string, value: T, ttlMs?: number) => Promise<VKVoidResult>;
  readonly remove: (key: string) => Promise<VKVoidResult>;
}

export interface VKSecureEnclaveTokenProviderOptions {
  /**
   * Secure, encrypted, or OS keychain backed asynchronous storage provider.
   */
  readonly storage: IVKAsyncTokenStorage;

  /**
   * Key used to store tokens inside the enclave.
   * Defaults to '__vk_auth_enclave_tokens__'.
   */
  readonly storageKey?: string;

  /**
   * Proactive refresh threshold in milliseconds. Defaults to 30,000ms.
   */
  readonly tokenRefreshThresholdMs?: number;

  /**
   * Clock skew tolerance in milliseconds. Defaults to 0ms.
   */
  readonly clockSkewMs?: number;

  /**
   * Refresh token callback handler.
   */
  readonly onRefresh?: (refreshToken: string) => Promise<VKResult<VKAuthTokens>>;

  /**
   * Callback invoked when the session has completely expired.
   */
  readonly onSessionExpired?: () => void;
}

/**
 * Enterprise Secure Enclave Token Provider.
 * Stores access and refresh tokens inside an encrypted or OS Keychain storage layer,
 * mitigating token leakage via devtools or unencrypted local storage.
 */
export class VKSecureEnclaveTokenProvider implements VKTokenProvider {
  private readonly storage: IVKAsyncTokenStorage;
  private readonly storageKey: string;
  private readonly tokenRefreshThresholdMs: number;
  private readonly clockSkewMs: number;
  private readonly onRefresh?: (refreshToken: string) => Promise<VKResult<VKAuthTokens>>;
  private readonly onSessionExpired?: () => void;

  private memoryCache: VKAuthTokens | null = null;
  private isHydrated = false;
  private readonly mutex = createMutex();
  private refreshPromise: Promise<VKResult<VKAuthTokens>> | null = null;

  constructor(options: VKSecureEnclaveTokenProviderOptions) {
    this.storage = options.storage;
    this.storageKey = options.storageKey ?? '__vk_auth_enclave_tokens__';
    this.tokenRefreshThresholdMs = options.tokenRefreshThresholdMs ?? 30000;
    this.clockSkewMs = options.clockSkewMs ?? 0;
    this.onRefresh = options.onRefresh;
    this.onSessionExpired = options.onSessionExpired;
  }

  private async hydrateTokens(): Promise<VKResult<VKAuthTokens | null>> {
    if (this.isHydrated) {
      return VKResult.success(this.memoryCache);
    }

    try {
      const result = await this.storage.get<VKAuthTokens>(this.storageKey);
      if (result.isFailure) {
        return VKResult.failure(result.errors[0]!);
      }
      this.memoryCache = result.value ?? null;
      this.isHydrated = true;
      return VKResult.success(this.memoryCache);
    } catch (err: unknown) {
      return VKResult.failure(
        VKError.failure(
          VKAuthErrorCodes.TokenEnclaveFailed,
          err instanceof Error ? err.message : 'Failed to hydrate tokens from secure enclave',
        ),
      );
    }
  }

  /**
   * Persists tokens into the secure enclave storage.
   */
  async setTokens(tokens: VKAuthTokens | null): Promise<VKVoidResult> {
    this.memoryCache = tokens;
    this.isHydrated = true;

    try {
      if (!tokens) {
        return await this.storage.remove(this.storageKey);
      }
      return await this.storage.set(this.storageKey, tokens);
    } catch (err: unknown) {
      return VKResult.failure(
        VKError.failure(
          VKAuthErrorCodes.TokenEnclaveFailed,
          err instanceof Error ? err.message : 'Failed to persist tokens into secure enclave',
        ),
      );
    }
  }

  /**
   * Wipes tokens from enclave and memory cache.
   */
  async clearTokens(): Promise<VKVoidResult> {
    return this.setTokens(null);
  }

  private isTokenExpiring(tokens: VKAuthTokens): boolean {
    if (!tokens.expiresAt) return false;
    return Date.now() + this.tokenRefreshThresholdMs + this.clockSkewMs >= tokens.expiresAt;
  }

  /**
   * Retrieves active access token from enclave. Performs proactive refresh if near expiration.
   */
  async getAccessToken(signal?: AbortSignal): Promise<VKResult<string | null>> {
    if (signal?.aborted) {
      return VKResult.failure(
        VKError.failure(VKAuthErrorCodes.TokenRequestAborted, 'Token acquisition was aborted.'),
      );
    }

    const hydrateRes = await this.hydrateTokens();
    if (hydrateRes.isFailure) {
      return VKResult.failure(hydrateRes.errors[0]!);
    }

    const tokens = hydrateRes.value;
    if (!tokens) {
      return VKResult.success(null);
    }

    if (tokens.refreshToken && this.isTokenExpiring(tokens)) {
      const refreshRes = await this.refreshToken(signal);
      if (refreshRes.isFailure) {
        return VKResult.failure(refreshRes.errors[0]!);
      }
      return VKResult.success(refreshRes.value.accessToken);
    }

    return VKResult.success(tokens.accessToken);
  }

  /**
   * Concurrency-safe single-flight refresh inside the enclave.
   */
  async refreshToken(signal?: AbortSignal): Promise<VKResult<VKAuthTokens>> {
    if (signal?.aborted) {
      return VKResult.failure(
        VKError.failure(VKAuthErrorCodes.TokenRequestAborted, 'Token refresh was aborted.'),
      );
    }

    const hydrateRes = await this.hydrateTokens();
    if (hydrateRes.isFailure) {
      return VKResult.failure(hydrateRes.errors[0]!);
    }

    const currentTokens = hydrateRes.value;
    if (!currentTokens || !currentTokens.refreshToken) {
      await this.clearTokens();
      this.onSessionExpired?.();
      return VKResult.failure(
        VKError.unauthorized(VKAuthErrorCodes.TokenNoRefreshToken, 'No refresh token available in enclave.'),
      );
    }
    const tokenToRefresh = currentTokens.refreshToken;

    if (!this.onRefresh) {
      return VKResult.failure(
        VKError.failure(VKAuthErrorCodes.TokenNoRefreshHandler, 'No refresh handler configured on enclave provider.'),
      );
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.mutex.run(async () => {
      try {
        const refreshResult = await this.onRefresh!(tokenToRefresh);
        if (refreshResult.isSuccess) {
          await this.setTokens(refreshResult.value);
          return refreshResult;
        } else {
          await this.clearTokens();
          this.onSessionExpired?.();
          return refreshResult;
        }
      } finally {
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }

  /**
   * Invalidates token cache per VKTokenProvider contract.
   */
  async invalidateToken(): Promise<void> {
    await this.clearTokens();
  }
}

/**
 * Creates an instance of VKSecureEnclaveTokenProvider.
 */
export function createSecureEnclaveTokenProvider(
  options: VKSecureEnclaveTokenProviderOptions,
): VKSecureEnclaveTokenProvider {
  return new VKSecureEnclaveTokenProvider(options);
}
