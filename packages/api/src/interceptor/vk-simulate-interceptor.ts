// [OR.03] [AP.05] Development Chaos & Network Latency Simulation Interceptor
// [AP.01] Strict TypeScript boundary
import { vkDelay, vkAssert } from '@vk-blocks/core';
import type {
  VKHttpInterceptor,
  VKHttpInterceptorContext,
  VKHttpInterceptorNext,
} from './vk-http-interceptor.js';
import type { VKHttpResponse } from '../transport/vk-http-transport.js';

export interface VKSimulateInterceptorOptions {
  /**
   * Artificial delay injected before executing the request (in milliseconds).
   * Supports a static number or dynamic getter callback.
   * Defaults to 0 (no delay).
   */
  readonly delayMs?: number | (() => number);

  /**
   * Whether to simulate an offline state.
   * If true (or returning true), the request immediately fails with a network failure response.
   */
  readonly simulateOffline?: boolean | (() => boolean);

  /**
   * Simulated HTTP status code to return instead of calling downstream (e.g. 500, 503, 429, 401).
   * If undefined (or returning undefined), request proceeds downstream normally.
   */
  readonly simulateStatus?: number | (() => number | undefined);

  /**
   * Simulated response body for injected status responses.
   */
  readonly simulateBody?: unknown | (() => unknown);

  /**
   * Probability of simulation trigger between 0.0 (never) and 1.0 (always).
   * Defaults to 1.0.
   */
  readonly failureRate?: number;

  /**
   * Filter predicate to only simulate on specific URL patterns or methods.
   */
  readonly matcher?: (url: string, method: string) => boolean;
}

/**
 * Creates an interceptor capable of injecting simulated network delays, offline errors,
 * and custom HTTP status codes for robust development and chaos testing.
 */
export function createVKSimulateInterceptor(
  options: VKSimulateInterceptorOptions,
): VKHttpInterceptor {
  vkAssert.notNull(options, 'options');

  return {
    name: 'VKSimulateInterceptor',
    intercept: async (
      context: VKHttpInterceptorContext,
      next: VKHttpInterceptorNext,
    ): Promise<VKHttpResponse> => {
      const url = context.request.url;
      const method = context.request.method;

      if (options.matcher && !options.matcher(url, method)) {
        return next(context.request);
      }

      const rate = options.failureRate ?? 1.0;
      const shouldTrigger = Math.random() <= rate;

      // 1. Artificial Latency Injection
      const delay = typeof options.delayMs === 'function' ? options.delayMs() : (options.delayMs ?? 0);
      if (delay > 0) {
        if (context.request.signal?.aborted) {
          throw new DOMException('The operation was aborted.', 'AbortError');
        }
        await vkDelay(delay);
        if (context.request.signal?.aborted) {
          throw new DOMException('The operation was aborted.', 'AbortError');
        }
      }

      if (!shouldTrigger) {
        return next(context.request);
      }

      // 2. Simulated Offline Disruption
      const isOffline =
        typeof options.simulateOffline === 'function'
          ? options.simulateOffline()
          : (options.simulateOffline ?? false);

      if (isOffline) {
        const offlineBody = {
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Network Unavailable',
          status: 503,
          detail: 'Simulated offline network disruption injected via VKSimulateInterceptor.',
          code: 'Network.Unavailable',
        };
        const bodyStr = JSON.stringify(offlineBody);

        return {
          status: 0,
          statusText: 'Network Unavailable (Simulated Offline)',
          headers: { 'content-type': 'application/problem+json' },
          text: async () => bodyStr,
          json: async () => offlineBody,
          blob: async () => new Blob([bodyStr], { type: 'application/problem+json' }),
          arrayBuffer: async () => new TextEncoder().encode(bodyStr).buffer,
        };
      }

      // 3. Simulated HTTP Status Injection (e.g. 429, 500, 503)
      const status =
        typeof options.simulateStatus === 'function'
          ? options.simulateStatus()
          : options.simulateStatus;

      if (status !== undefined && status > 0) {
        const rawBody =
          typeof options.simulateBody === 'function'
            ? options.simulateBody()
            : (options.simulateBody ?? {
                type: 'https://tools.ietf.org/html/rfc7807',
                title: `HTTP ${status}`,
                status,
                detail: `Simulated HTTP ${status} error injected via VKSimulateInterceptor.`,
                code: `Simulated.Http.${status}`,
              });

        const bodyStr = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

        return {
          status,
          statusText: `Simulated HTTP ${status}`,
          headers: {
            'content-type': typeof rawBody === 'string' ? 'text/plain' : 'application/problem+json',
            ...(status === 429 ? { 'retry-after': '3' } : {}),
          },
          text: async () => bodyStr,
          json: async () => (typeof rawBody === 'object' && rawBody !== null ? rawBody : JSON.parse(bodyStr)),
          blob: async () => new Blob([bodyStr]),
          arrayBuffer: async () => new TextEncoder().encode(bodyStr).buffer,
        };
      }

      // 4. Default Downstream Pass-Through
      return next(context.request);
    },
  };
}
