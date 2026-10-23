// [CS.06] [OR.01] Timing and performance telemetry middleware
import { VKApiMiddleware, VKApiRequestContext, VKApiNextFn } from '../vk-api-middleware.js';
import { VKResult, VKLogger, VKTimeProvider, defaultTimeProvider } from '@vk-blocks/core';

export interface TimingMiddlewareOptions {
  readonly logger?: VKLogger;
  readonly timeProvider?: VKTimeProvider;
  readonly onTiming?: (
    durationMs: number,
    context: VKApiRequestContext,
    result: VKResult<unknown>,
  ) => void;
}

/**
 * Creates a middleware that measures API request execution duration and logs telemetry.
 * Strictly adheres to [CS.06] by using VKTimeProvider rather than raw Date.now().
 */
export function createTimingMiddleware(options?: TimingMiddlewareOptions): VKApiMiddleware {
  const clock = options?.timeProvider ?? defaultTimeProvider;

  return {
    name: 'TimingMiddleware',
    handle: async <TOutput>(
      context: VKApiRequestContext,
      next: VKApiNextFn<TOutput>,
    ): Promise<VKResult<TOutput>> => {
      const startMs = clock.timestamp();
      const result = await next(context);
      const endMs = clock.timestamp();
      const durationMs = endMs - startMs;

      if (options?.logger) {
        options.logger.debug(
          `[API] ${context.method} ${context.path} completed in ${durationMs}ms (success: ${result.isSuccess})`,
          {
            module: 'API',
            action: context.method,
            path: context.path,
            durationMs,
            isSuccess: result.isSuccess,
          },
        );
      }

      if (options?.onTiming) {
        options.onTiming(durationMs, context, result as VKResult<unknown>);
      }

      return result;
    },
  };
}
