// [AP.04] [CS.01] [AP.01] Internal Optimistic Update & Snapshot Rollback Pipeline
import {
  type QueryClient,
  type QueryKey,
  type MutationFunctionContext,
} from '@tanstack/react-query';
import { vkAssert, type VKResult, type VKError } from '@vk-blocks/core';

/**
 * Declarative configuration for optimistic updates and snapshot rollbacks (AP.04).
 */
export interface VKOptimisticOptions<TQueryData, TVariables> {
  /**
   * Target QueryKey whose cache will be optimistically updated and snapshotted.
   * Can be a static QueryKey or dynamic selector: (variables: TVariables) => QueryKey.
   */
  readonly queryKey: QueryKey | ((variables: TVariables) => QueryKey);

  /**
   * Optimistic updater function calculating the new query data before the network response arrives.
   */
  readonly update: (currentData: TQueryData | undefined, variables: TVariables) => TQueryData;

  /**
   * Additional QueryKeys to invalidate onSettled (in addition to the target queryKey).
   */
  readonly additionalInvalidateKeys?: readonly (
    | QueryKey
    | ((variables: TVariables) => QueryKey)
  )[];

  /**
   * Whether to automatically invalidate the target queryKey onSettled to synchronize authoritative server state.
   * Defaults to true.
   */
  readonly invalidateOnSettled?: boolean;
}

/**
 * Snapshot context captured in onMutate for rollback recovery.
 */
export interface VKOptimisticContext<TQueryData> {
  readonly previousData: TQueryData | undefined;
  readonly targetKey: QueryKey;
  readonly userContext?: unknown;
}

/**
 * Callbacks passed to createVKOptimisticCallbacks.
 */
export interface VKOptimisticCallbacks<TData, TVariables> {
  readonly onMutate?: (
    variables: TVariables,
    context: MutationFunctionContext,
  ) => Promise<unknown> | unknown;
  readonly onError?: (
    error: Error,
    variables: TVariables,
    context: unknown,
    mutationContext: MutationFunctionContext,
  ) => Promise<unknown> | unknown;
  readonly onResultSuccess?: (
    data: TData,
    variables: TVariables,
    context?: unknown,
  ) => Promise<unknown> | unknown;
  readonly onResultFailure?: (
    errors: readonly VKError[],
    variables: TVariables,
    context?: unknown,
  ) => Promise<unknown> | unknown;
  readonly onSettled?: (
    data: VKResult<TData> | undefined,
    error: Error | null,
    variables: TVariables,
    context: unknown,
    mutationContext: MutationFunctionContext,
  ) => Promise<unknown> | unknown;
}

/**
 * Constructs standard optimistic update callbacks given an active QueryClient (AP.04 / CS.01).
 */
export function createVKOptimisticCallbacks<TData, TVariables, TQueryData>(
  queryClient: QueryClient,
  optimistic: VKOptimisticOptions<TQueryData, TVariables>,
  callbacks?: VKOptimisticCallbacks<TData, TVariables>,
) {
  // [AP.01] Boundary assertions
  vkAssert.notNull(queryClient, 'queryClient');
  vkAssert.notNull(optimistic, 'optimistic');

  const resolveTargetKey = (variables: TVariables): QueryKey => {
    return typeof optimistic.queryKey === 'function'
      ? optimistic.queryKey(variables)
      : optimistic.queryKey;
  };

  return {
    onMutate: async (
      variables: TVariables,
      context: MutationFunctionContext,
    ): Promise<VKOptimisticContext<TQueryData>> => {
      const targetKey = resolveTargetKey(variables);

      // 1. Cancel in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: targetKey });

      // 2. Snapshot current cached data for rollback
      const previousData = queryClient.getQueryData<TQueryData>(targetKey);

      // 3. Apply optimistic update to cache
      const nextData = optimistic.update(previousData, variables);
      queryClient.setQueryData<TQueryData>(targetKey, nextData);

      // 4. Execute custom onMutate if supplied
      const userContext = callbacks?.onMutate
        ? await callbacks.onMutate(variables, context)
        : undefined;

      return {
        previousData,
        targetKey,
        userContext,
      };
    },

    onError: async (
      error: Error,
      variables: TVariables,
      onMutateResult: unknown,
      context: MutationFunctionContext,
    ): Promise<void> => {
      const optimisticContext = onMutateResult as
        | VKOptimisticContext<TQueryData>
        | undefined;

      // 1. Rollback cache to previous snapshot
      if (optimisticContext?.targetKey) {
        queryClient.setQueryData(
          optimisticContext.targetKey,
          optimisticContext.previousData,
        );
      }

      // 2. Trigger user onError callback
      if (callbacks?.onError) {
        await callbacks.onError(
          error,
          variables,
          optimisticContext?.userContext,
          context,
        );
      }
    },

    onSuccess: async (
      result: VKResult<TData>,
      variables: TVariables,
      onMutateResult: unknown,
      _context: MutationFunctionContext,
    ): Promise<void> => {
      const optimisticContext = onMutateResult as
        | VKOptimisticContext<TQueryData>
        | undefined;

      // [CS.01] If API returned a typed VKResult.failure, rollback cache just like a network rejection
      if (result.isFailure) {
        if (optimisticContext?.targetKey) {
          queryClient.setQueryData(
            optimisticContext.targetKey,
            optimisticContext.previousData,
          );
        }
        if (callbacks?.onResultFailure) {
          await callbacks.onResultFailure(
            result.errors,
            variables,
            optimisticContext?.userContext,
          );
        }
      } else {
        if (callbacks?.onResultSuccess) {
          await callbacks.onResultSuccess(
            result.value,
            variables,
            optimisticContext?.userContext,
          );
        }
      }
    },

    onSettled: async (
      data: VKResult<TData> | undefined,
      error: Error | null,
      variables: TVariables,
      onMutateResult: unknown,
      context: MutationFunctionContext,
    ): Promise<void> => {
      const optimisticContext = onMutateResult as
        | VKOptimisticContext<TQueryData>
        | undefined;

      // 1. Invalidate authoritative target cache to synchronize with server
      const shouldInvalidateTarget = optimistic.invalidateOnSettled !== false;
      if (shouldInvalidateTarget && optimisticContext?.targetKey) {
        await queryClient.invalidateQueries({
          queryKey: optimisticContext.targetKey,
        });
      }

      // 2. Invalidate any additional linked query keys
      if (
        optimistic.additionalInvalidateKeys &&
        optimistic.additionalInvalidateKeys.length > 0
      ) {
        for (const extraKey of optimistic.additionalInvalidateKeys) {
          const resolvedKey =
            typeof extraKey === 'function' ? extraKey(variables) : extraKey;
          await queryClient.invalidateQueries({ queryKey: resolvedKey });
        }
      }

      // 3. Trigger user onSettled callback
      if (callbacks?.onSettled) {
        await callbacks.onSettled(
          data,
          error,
          variables,
          optimisticContext?.userContext,
          context,
        );
      }
    },
  };
}
