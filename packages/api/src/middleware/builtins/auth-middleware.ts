// [OR.02] Bearer authentication middleware
import type { VKTokenProvider } from '../../types/vk-token-provider.js';
import { VKApiMiddleware, VKApiRequestContext, VKApiNextFn } from '../vk-api-middleware.js';
import { VKResult } from '@vk-blocks/core';

export type TokenProvider =
  | VKTokenProvider
  | (() => string | null | undefined | Promise<string | null | undefined>);

/**
 * Creates an authentication middleware that injects a Bearer token into the Authorization header.
 * Accepts either an enterprise VKTokenProvider (with Result/cancellation) or a simple token resolver function.
 * If token acquisition fails, it short-circuits with the failure Result.
 * If the token is empty or null, the header remains unchanged.
 */
export function createBearerAuthMiddleware(provider: TokenProvider): VKApiMiddleware {
  return {
    name: 'BearerAuthMiddleware',
    handle: async <TOutput>(
      context: VKApiRequestContext,
      next: VKApiNextFn<TOutput>,
    ): Promise<VKResult<TOutput>> => {
      let token: string | null | undefined = null;

      if (typeof provider === 'function') {
        token = await provider();
      } else if (provider && typeof provider.getAccessToken === 'function') {
        const tokenResult = await provider.getAccessToken(context.signal);
        if (tokenResult.isFailure) {
          return VKResult.failureMany(tokenResult.errors);
        }
        token = tokenResult.value;
      }

      if (!token) {
        return next(context);
      }

      const updatedContext: VKApiRequestContext = {
        ...context,
        headers: {
          ...context.headers,
          Authorization: `Bearer ${token}`,
        },
      };

      return next(updatedContext);
    },
  };
}

