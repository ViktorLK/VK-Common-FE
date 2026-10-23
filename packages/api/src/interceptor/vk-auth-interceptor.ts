// [AP.05] [CS.03] Enterprise Token Authentication Interceptor with Single-Flight Refresh
import { vkAssert, vkSingleFlight, VKError, VKResult } from '@vk-blocks/core';
import type { VKTokenProvider } from '../types/vk-token-provider.js';
import type {
  VKHttpInterceptor,
  VKHttpInterceptorContext,
  VKHttpInterceptorNext,
} from './vk-http-interceptor.js';
import type { VKHttpRequest, VKHttpResponse } from '../transport/vk-http-transport.js';

export interface VKAuthInterceptorOptions {
  /**
   * Token provider SPI supplying active access tokens and handling token invalidation.
   */
  readonly tokenProvider: VKTokenProvider;

  /**
   * Header name to inject. Defaults to 'Authorization'.
   */
  readonly headerName?: string;

  /**
   * Formats authorization header value from raw token string.
   * Defaults to: (token) => `Bearer ${token}`.
   */
  readonly formatAuthorizationHeader?: (token: string) => string;

  /**
   * Automatically refreshes access token upon receiving 401 Unauthorized,
   * deduplicating concurrent refresh requests via Single-Flight (CS.03),
   * and replays the original request.
   * Defaults to true.
   */
  readonly autoRefreshOn401?: boolean;
}

/**
 * Creates an authentication interceptor supporting Bearer injection and
 * concurrent single-flight token refresh upon 401 Unauthorized (Item 2 / AP.05 / CS.03).
 */
export function createVKAuthInterceptor(options: VKAuthInterceptorOptions): VKHttpInterceptor {
  // [AP.01] Boundary assertions
  vkAssert.notNull(options, 'options');
  vkAssert.notNull(options.tokenProvider, 'options.tokenProvider');

  const {
    tokenProvider,
    headerName = 'Authorization',
    formatAuthorizationHeader = (token: string) => `Bearer ${token}`,
    autoRefreshOn401 = true,
  } = options;

  // Single-flight wrapped refresh executor: all concurrent 401s join a single in-flight refresh promise
  const singleFlightRefreshToken = vkSingleFlight(async (): Promise<VKResult<string | null>> => {
    try {
      if (tokenProvider.invalidateToken) {
        await tokenProvider.invalidateToken();
      }
      return await tokenProvider.getAccessToken();
    } catch (err: unknown) {
      const error =
        err instanceof VKError
          ? err
          : VKError.failure(
              'HTTP.TokenRefreshFailed',
              err instanceof Error ? err.message : 'Token refresh failed',
            );
      return VKResult.failure<string | null>(error);
    }
  });

  return {
    name: 'VKAuthInterceptor',
    intercept: async (
      context: VKHttpInterceptorContext,
      next: VKHttpInterceptorNext,
    ): Promise<VKHttpResponse> => {
      const currentHeaders: Record<string, string> = { ...context.request.headers };

      // Step 1: Inject Bearer token before initial request if header is missing
      const hasAuthHeader = Object.keys(currentHeaders).some(
        (k) => k.toLowerCase() === headerName.toLowerCase(),
      );

      if (!hasAuthHeader) {
        try {
          const tokenResult = await tokenProvider.getAccessToken(context.request.signal);
          if (tokenResult.isSuccess && tokenResult.value) {
            currentHeaders[headerName] = formatAuthorizationHeader(tokenResult.value);
          }
        } catch {
          // Ignore error during initial token fetch; proceed so server can return structured 401
        }
      }

      const initialRequest: VKHttpRequest = {
        ...context.request,
        headers: currentHeaders,
      };

      const response = await next(initialRequest);

      // Step 2: Handle 401 Unauthorized with Single-Flight refresh and automatic replay
      if (
        response.status === 401 &&
        autoRefreshOn401 &&
        !context.metadata['_vk_auth_retried']
      ) {
        context.metadata['_vk_auth_retried'] = true;

        const refreshedResult = await singleFlightRefreshToken();
        if (refreshedResult.isSuccess && refreshedResult.value) {
          const replayHeaders: Record<string, string> = { ...currentHeaders };
          for (const key of Object.keys(replayHeaders)) {
            if (key.toLowerCase() === headerName.toLowerCase()) {
              delete replayHeaders[key];
            }
          }
          replayHeaders[headerName] = formatAuthorizationHeader(refreshedResult.value);

          const replayedRequest: VKHttpRequest = {
            ...context.request,
            headers: replayHeaders,
          };

          return next(replayedRequest);
        }
      }

      return response;
    },
  };
}
