// [BASE-01] Contract-First: Universal Onion Middleware Pipeline Contracts
// [CS.01] Typed VKResult-based pipeline flow
// [CS.03] AbortSignal cooperative cancellation
import type { VKResult } from '../result/index.js';

/**
 * Next function delegate in the onion middleware pipeline.
 */
export type VKNextFn<TContext, TOutput> = (context: TContext) => Promise<VKResult<TOutput>>;

/**
 * Object-oriented onion middleware unit wrapping execution around next().
 */
export interface VKMiddleware<TContext, TOutput> {
  readonly name?: string;
  readonly handle: (
    context: TContext,
    next: VKNextFn<TContext, TOutput>,
  ) => Promise<VKResult<TOutput>>;
}

/**
 * Functional onion middleware representation.
 */
export type VKMiddlewareFn<TContext, TOutput> = (
  context: TContext,
  next: VKNextFn<TContext, TOutput>,
) => Promise<VKResult<TOutput>>;

/**
 * Options for executing an onion middleware pipeline.
 */
export interface VKOnionPipelineOptions {
  /**
   * Optional AbortSignal enabling cooperative cancellation across the pipeline.
   */
  readonly signal?: AbortSignal;
}

/**
 * Universal Onion Pipeline runner interface.
 */
export interface VKOnionPipeline<TContext, TOutput> {
  /**
   * Appends one or more middlewares to the pipeline.
   */
  readonly use: (
    ...middlewares: ReadonlyArray<
      VKMiddleware<TContext, TOutput> | VKMiddlewareFn<TContext, TOutput>
    >
  ) => VKOnionPipeline<TContext, TOutput>;

  /**
   * Executes the pipeline with a given initial context and final handler.
   */
  readonly execute: (
    initialContext: TContext,
    finalHandler: VKNextFn<TContext, TOutput>,
    options?: VKOnionPipelineOptions,
  ) => Promise<VKResult<TOutput>>;
}
