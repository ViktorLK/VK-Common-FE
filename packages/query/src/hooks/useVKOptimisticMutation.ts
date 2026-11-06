// [AP.04] [CS.01] [AP.01] Standard Optimistic Update & Snapshot Rollback Pipeline for TanStack Query
import { vkAssert } from '@vk-blocks/core';
import {
  useVKMutation,
  type UseVKMutationOptions,
  type UseVKMutationResult,
} from './useVKMutation.js';
import {
  type VKOptimisticOptions,
  type VKOptimisticContext,
  createVKOptimisticCallbacks,
} from './_internal/optimistic-pipeline.js';

export type { VKOptimisticOptions, VKOptimisticContext };
export { createVKOptimisticCallbacks };

/**
 * Options for useVKOptimisticMutation hook.
 */
export interface UseVKOptimisticMutationOptions<
  TData,
  TVariables = void,
  TQueryData = unknown,
> extends Omit<
    UseVKMutationOptions<TData, TVariables, TQueryData>,
    'optimistic'
  > {
  /**
   * Required optimistic update and snapshot rollback configuration.
   */
  readonly optimistic: VKOptimisticOptions<TQueryData, TVariables>;
}

/**
 * Hook providing a standardized optimistic update pipeline with automatic snapshot rollback (AP.04 / CS.01).
 *
 * Automatically:
 * 1. Cancels in-flight queries and captures a cache snapshot before executing.
 * 2. Applies the optimistic updater to query cache for instant UI response.
 * 3. Automatically rolls back to the previous snapshot on network errors OR typed `VKResult.failure`.
 * 4. Invalidates the target and linked QueryKeys on settled.
 *
 * @example
 * ```tsx
 * const mutation = useVKOptimisticMutation({
 *   mutationFn: (newTodo) => apiClient.post('/todos', newTodo),
 *   optimistic: {
 *     queryKey: todoKeys.list(),
 *     update: (old, newTodo) => [...(old ?? []), { ...newTodo, id: 'temp-id' }],
 *   },
 * });
 * ```
 */
export function useVKOptimisticMutation<
  TData,
  TVariables = void,
  TQueryData = unknown,
>(
  options: UseVKOptimisticMutationOptions<TData, TVariables, TQueryData>,
): UseVKMutationResult<TData, TVariables> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(options, 'options');
  vkAssert.notNull(options.optimistic, 'options.optimistic');

  return useVKMutation<TData, TVariables, TQueryData>(options);
}
