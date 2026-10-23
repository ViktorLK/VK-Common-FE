// [AP.01] Dynamic header injection middleware
import { VKApiMiddleware, VKApiRequestContext, VKApiNextFn } from '../vk-api-middleware.js';
import { VKResult } from '@vk-blocks/core';

export type HeaderProvider = () =>
  | Readonly<Record<string, string>>
  | Promise<Readonly<Record<string, string>>>;

/**
 * Creates a middleware that dynamically injects headers (e.g. Tenant-ID, Client-Version, Trace-Id).
 */
export function createHeaderInjectionMiddleware(
  getHeaderValues: HeaderProvider,
  name = 'HeaderInjectionMiddleware',
): VKApiMiddleware {
  return {
    name,
    handle: async <TOutput>(
      context: VKApiRequestContext,
      next: VKApiNextFn<TOutput>,
    ): Promise<VKResult<TOutput>> => {
      const dynamicHeaders = await getHeaderValues();
      const updatedContext: VKApiRequestContext = {
        ...context,
        headers: {
          ...context.headers,
          ...dynamicHeaders,
        },
      };

      return next(updatedContext);
    },
  };
}
