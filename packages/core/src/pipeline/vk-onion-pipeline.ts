// [BASE-01] Contract-First Universal Onion Middleware Pipeline Engine
// [CS.01] Results over Exceptions
// [CS.03] AbortSignal-aware cooperative cancellation
import { VKResult } from '../result/index.js';
import { VKError } from '../errors/index.js';
import { VKPipelineErrorCodes } from './pipeline.errors.js';
import type {
  VKMiddleware,
  VKMiddlewareFn,
  VKNextFn,
  VKOnionPipeline,
  VKOnionPipelineOptions,
} from './onion-pipeline.types.js';

/**
 * Executes a series of onion middlewares with cooperative cancellation support.
 */
export async function executeOnionPipeline<TContext, TOutput>(
  middlewares: ReadonlyArray<VKMiddleware<TContext, TOutput> | VKMiddlewareFn<TContext, TOutput>>,
  initialContext: TContext,
  finalHandler: VKNextFn<TContext, TOutput>,
  options?: VKOnionPipelineOptions,
): Promise<VKResult<TOutput>> {
  let index = -1;

  async function dispatch(i: number, ctx: TContext): Promise<VKResult<TOutput>> {
    // Check cooperative cancellation before invoking layer
    if (options?.signal?.aborted) {
      return VKResult.failure(
        VKError.timeout(
          VKPipelineErrorCodes.Aborted,
          'Pipeline execution was aborted.',
        ),
      );
    }

    if (i <= index) {
      return VKResult.failure(
        VKError.failure(
          VKPipelineErrorCodes.MultipleNextCalls,
          'next() called multiple times in middleware pipeline.',
        ),
      );
    }
    index = i;

    if (i < middlewares.length) {
      const mw = middlewares[i];
      const handler = typeof mw === 'function' ? mw : mw.handle;
      try {
        return await handler(ctx, (nextCtx) => dispatch(i + 1, nextCtx));
      } catch (err) {
        return VKResult.failure(
          VKError.failure(
            VKPipelineErrorCodes.StageFailed,
            `Middleware threw unhandled exception: ${err instanceof Error ? err.message : String(err)}`,
            { cause: err },
          ),
        );
      }
    }

    try {
      return await finalHandler(ctx);
    } catch (err) {
      return VKResult.failure(
        VKError.failure(
          VKPipelineErrorCodes.StageFailed,
          `Final handler threw unhandled exception: ${err instanceof Error ? err.message : String(err)}`,
          { cause: err },
        ),
      );
    }
  }

  return dispatch(0, initialContext);
}

/**
 * Universal Onion Pipeline builder factory.
 */
export function createVKOnionPipeline<TContext, TOutput>(): VKOnionPipeline<TContext, TOutput> {
  const middlewares: Array<VKMiddleware<TContext, TOutput> | VKMiddlewareFn<TContext, TOutput>> = [];

  const pipeline: VKOnionPipeline<TContext, TOutput> = {
    use(...mws) {
      middlewares.push(...mws);
      return pipeline;
    },
    execute(initialContext, finalHandler, options) {
      return executeOnionPipeline(middlewares, initialContext, finalHandler, options);
    },
  };

  return pipeline;
}
