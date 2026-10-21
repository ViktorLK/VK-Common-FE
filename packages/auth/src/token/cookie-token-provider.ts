// [ARCH-02] [BASE-02] [OR.02] Cookie-based / BFF Session Token Provider
import { VKResult, VKError, type VKTokenProvider } from '@vk-blocks/core';
import { VKAuthErrorCodes } from '../constants/errors.js';

export interface VKCookieTokenProviderOptions {
  /**
   * Endpoint URL to probe whether the HttpOnly cookie session is still alive (e.g. '/api/auth/session').
   * Defaults to '/api/auth/session'.
   */
  readonly sessionProbeUrl?: string;

  /**
   * Name of CSRF token cookie to extract if double-submit CSRF protection is used (e.g. 'XSRF-TOKEN').
   */
  readonly csrfCookieName?: string;

  /**
   * Custom credentials policy for fetch requests (defaults to 'include').
   */
  readonly credentials?: RequestCredentials;

  /**
   * Optional extractor to retrieve an access token or session ID from probe response JSON.
   * If not provided, returns CSRF token or confirms session existence.
   */
  readonly tokenExtractor?: (sessionData: unknown) => string | null;

  /**
   * Cache duration in milliseconds for successful session probes to prevent probe spam.
   * Defaults to 30,000ms (30s).
   */
  readonly probeCacheTtlMs?: number;

  /**
   * Callback invoked when a session probe returns 401 or unauthenticated.
   */
  readonly onSessionExpired?: () => void;
}

/**
 * Cookie-based Session Token Provider for BFF (Backend-For-Frontend) architectures.
 * Safely delegates credential storage to secure, HttpOnly, SameSite cookies in the browser.
 */
export class VKCookieTokenProvider implements VKTokenProvider {
  private readonly sessionProbeUrl: string;
  private readonly csrfCookieName?: string;
  private readonly credentials: RequestCredentials;
  private readonly tokenExtractor?: (sessionData: unknown) => string | null;
  private readonly probeCacheTtlMs: number;
  private readonly onSessionExpired?: () => void;

  private lastProbeTime = 0;
  private cachedToken: string | null = null;
  private isSessionValid = false;

  constructor(options: VKCookieTokenProviderOptions = {}) {
    this.sessionProbeUrl = options.sessionProbeUrl ?? '/api/auth/session';
    this.csrfCookieName = options.csrfCookieName;
    this.credentials = options.credentials ?? 'include';
    this.tokenExtractor = options.tokenExtractor;
    this.probeCacheTtlMs = options.probeCacheTtlMs ?? 30000;
    this.onSessionExpired = options.onSessionExpired;
  }

  private extractCsrfFromDocument(): string | null {
    if (typeof document === 'undefined' || !this.csrfCookieName) {
      return null;
    }
    const match = document.cookie.match(new RegExp(`(^|;\\s*)(${this.csrfCookieName})=([^;]*)`));
    return match ? decodeURIComponent(match[3] ?? '') : null;
  }

  /**
   * Verifies if cookie session is active via session probe endpoint.
   */
  async probeSession(signal?: AbortSignal): Promise<VKResult<boolean>> {
    if (signal?.aborted) {
      return VKResult.failure(
        VKError.failure(VKAuthErrorCodes.TokenRequestAborted, 'Session probe was aborted.'),
      );
    }

    const now = Date.now();
    if (this.isSessionValid && now - this.lastProbeTime < this.probeCacheTtlMs) {
      return VKResult.success(true);
    }

    if (typeof fetch === 'undefined') {
      return VKResult.success(this.isSessionValid);
    }

    try {
      const response = await fetch(this.sessionProbeUrl, {
        method: 'GET',
        credentials: this.credentials,
        signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        this.isSessionValid = false;
        this.cachedToken = null;
        if (response.status === 401 || response.status === 403) {
          this.onSessionExpired?.();
        }
        return VKResult.success(false);
      }

      this.isSessionValid = true;
      this.lastProbeTime = now;

      if (this.tokenExtractor) {
        try {
          const data = (await response.json()) as unknown;
          this.cachedToken = this.tokenExtractor(data);
        } catch {
          this.cachedToken = null;
        }
      }

      return VKResult.success(true);
    } catch (err: unknown) {
      return VKResult.failure(
        VKError.failure(
          VKAuthErrorCodes.TokenCookieProbeFailed,
          err instanceof Error ? err.message : 'Failed to probe cookie session',
        ),
      );
    }
  }

  /**
   * Retrieves active access token per VKTokenProvider contract.
   * If tokenExtractor is defined, returns extracted token.
   * Otherwise returns CSRF token or null if unauthenticated.
   */
  async getAccessToken(signal?: AbortSignal): Promise<VKResult<string | null>> {
    const probeRes = await this.probeSession(signal);
    if (probeRes.isFailure) {
      return VKResult.failure(probeRes.errors[0]!);
    }

    if (!probeRes.value) {
      return VKResult.success(null);
    }

    if (this.cachedToken) {
      return VKResult.success(this.cachedToken);
    }

    const csrf = this.extractCsrfFromDocument();
    return VKResult.success(csrf);
  }

  /**
   * Invalidates cached probe state upon 401 or logout.
   */
  async invalidateToken(): Promise<void> {
    this.isSessionValid = false;
    this.cachedToken = null;
    this.lastProbeTime = 0;
  }
}

/**
 * Creates an instance of VKCookieTokenProvider.
 */
export function createCookieTokenProvider(
  options?: VKCookieTokenProviderOptions,
): VKCookieTokenProvider {
  return new VKCookieTokenProvider(options);
}
