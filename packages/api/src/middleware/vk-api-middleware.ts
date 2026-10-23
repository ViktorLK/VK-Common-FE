// [CS.01] Enterprise onion-style middleware pipeline for VKApiClient
import { VKResult, executeOnionPipeline } from '@vk-blocks/core';
import type { VKQueryParamValue } from '../client/vk-http-client.js';
import type { VKListQuery } from '../query/vk-list-query.js';

export interface VKApiRequestContext {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly headers: Record<string, string>;
  readonly params?: Readonly<Record<string, VKQueryParamValue>> | VKListQuery;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly metadata: Record<string, unknown>;
}

export type VKApiNextFn<TOutput> = (context: VKApiRequestContext) => Promise<VKResult<TOutput>>;

export interface VKApiMiddleware {
  readonly name?: string;
  readonly handle: <TOutput>(
    context: VKApiRequestContext,
    next: VKApiNextFn<TOutput>,
  ) => Promise<VKResult<TOutput>>;
}

/**
 * Executes a sequence of middlewares in an onion-pipeline pattern.
 * Delegated to @vk-blocks/core universal onion pipeline with cooperative cancellation support.
 */
export async function executeMiddlewarePipeline<TOutput>(
  middlewares: readonly VKApiMiddleware[],
  initialContext: VKApiRequestContext,
  finalHandler: VKApiNextFn<TOutput>,
): Promise<VKResult<TOutput>> {
  return executeOnionPipeline<VKApiRequestContext, TOutput>(
    middlewares,
    initialContext,
    finalHandler,
    { signal: initialContext.signal },
  );
}
