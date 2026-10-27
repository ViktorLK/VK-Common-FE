// [AP.04] [CS.01] [AP.01] Offline-First Outbox Mutation Hook with Optimistic Updates
import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  VKResult,
  VKError,
  vkAssert,
  type VKError as TVKError,
} from '@vk-blocks/core';
import { useVKOutboxContext } from '../providers/VKOutboxProvider.js';
import {
  type VKOptimisticOptions,
  type VKOptimisticContext,
} from './_internal/optimistic-pipeline.js';
import { type VKOutboxEnqueueOptions } from '../outbox/types.js';

export interface UseVKOutboxMutationOptions<
  TData,
  TVariables = void,
  TQueryData = unknown,
> {
  /**
   * Unique mutation identifier registered with the outbox replay engine.
   */
  readonly mutationType: string;

  /**
   * Mutation function executing the remote network request when online.
   */
  readonly mutationFn: (variables: TVariables) => Promise<VKResult<TData>>;

  /**
   * Declarative optimistic update configuration (AP.04).
   * Applied immediately upon mutation dispatch, whether online or offline.
   */
  readonly optimistic?: VKOptimisticOptions<TQueryData, TVariables>;

  /**
   * Callback fired when mutation completes or is queued offline.
   * @param data The resolved result value, or undefined if queued offline.
   * @param variables The input variables.
   * @param isQueued True if the mutation was stored in the outbox rather than completed live.
   */
  readonly onResultSuccess?: (
    data: TData | undefined,
    variables: TVariables,
    isQueued: boolean,
  ) => Promise<unknown> | unknown;

  /**
   * Callback fired when mutation execution or enqueuing fails.
   */
  readonly onResultFailure?: (
    errors: readonly TVKError[],
    variables: TVariables,
  ) => Promise<unknown> | unknown;

  /**
   * Options for outbox enqueuing (e.g. maxRetries, metadata).
   */
  readonly outboxOptions?: VKOutboxEnqueueOptions;
}

export interface UseVKOutboxMutationResult<TData, TVariables = void> {
  readonly mutate: (variables: TVariables) => void;
  readonly mutateAsync: (variables: TVariables) => Promise<VKResult<TData>>;
  readonly isPending: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;
  /** True if the mutation was enqueued into the offline outbox for later replay. */
  readonly isQueued: boolean;
  readonly result: VKResult<TData> | undefined;
  readonly value: TData | undefined;
  readonly errors: readonly TVKError[];
  readonly reset: () => void;
}

/**
 * Offline-first mutation hook with automatic outbox persistence and optimistic updates.
 *
 * Behavior:
 * 1. When online: executes mutationFn directly. If network failure occurs, automatically enqueues to outbox.
 * 2. When offline: immediately enqueues mutation to IndexedDB outbox and applies optimistic UI update.
 * 3. On reconnect: outbox replayer processes pending mutations in FIFO order.
 */
export function useVKOutboxMutation<
  TData,
  TVariables = void,
  TQueryData = unknown,
>(
  options: UseVKOutboxMutationOptions<TData, TVariables, TQueryData>,
): UseVKOutboxMutationResult<TData, TVariables> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(options, 'options');
  vkAssert.notEmpty(options.mutationType, 'options.mutationType');
  vkAssert.notNull(options.mutationFn, 'options.mutationFn');

  const {
    mutationType,
    mutationFn,
    optimistic,
    onResultSuccess,
    onResultFailure,
    outboxOptions,
  } = options;

  const queryClient = useQueryClient();
  const { outboxManager } = useVKOutboxContext();

  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [result, setResult] = useState<VKResult<TData> | undefined>(undefined);

  // Store latest mutationFn in a ref to avoid recreating registration handler
  const mutationFnRef = useRef(mutationFn);
  mutationFnRef.current = mutationFn;

  // Register mutation handler with OutboxManager for replay on reconnect
  useEffect(() => {
    const unregister = outboxManager.registerHandler(
      mutationType,
      async (payload) => {
        return mutationFnRef.current(payload as TVariables);
      },
    );

    return () => {
      unregister();
    };
  }, [outboxManager, mutationType]);

  const applyOptimistic = useCallback(
    async (variables: TVariables): Promise<VKOptimisticContext<TQueryData> | null> => {
      if (!optimistic) {
        return null;
      }
      const targetKey =
        typeof optimistic.queryKey === 'function'
          ? optimistic.queryKey(variables)
          : optimistic.queryKey;

      await queryClient.cancelQueries({ queryKey: targetKey });
      const previousData = queryClient.getQueryData<TQueryData>(targetKey);
      const nextData = optimistic.update(previousData, variables);
      queryClient.setQueryData<TQueryData>(targetKey, nextData);

      return {
        previousData,
        targetKey,
      };
    },
    [queryClient, optimistic],
  );

  const rollbackOptimistic = useCallback(
    (context: VKOptimisticContext<TQueryData> | null) => {
      if (context?.targetKey) {
        queryClient.setQueryData(context.targetKey, context.previousData);
      }
    },
    [queryClient],
  );

  const invalidateQueries = useCallback(
    async (context: VKOptimisticContext<TQueryData> | null, variables: TVariables) => {
      if (!optimistic) {
        return;
      }
      if (optimistic.invalidateOnSettled !== false && context?.targetKey) {
        await queryClient.invalidateQueries({ queryKey: context.targetKey });
      }
      if (optimistic.additionalInvalidateKeys) {
        for (const extraKey of optimistic.additionalInvalidateKeys) {
          const resolved =
            typeof extraKey === 'function' ? extraKey(variables) : extraKey;
          await queryClient.invalidateQueries({ queryKey: resolved });
        }
      }
    },
    [queryClient, optimistic],
  );

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<VKResult<TData>> => {
      setIsPending(true);
      setIsError(false);
      setIsSuccess(false);
      setIsQueued(false);
      setResult(undefined);

      // 1. Apply optimistic update immediately
      const optimisticCtx = await applyOptimistic(variables);

      // 2. Check online status
      const isOnline = outboxManager.isOnline();

      if (!isOnline) {
        // [Offline Path]: Enqueue to outbox write log
        const enqueueRes = await outboxManager.enqueue(
          mutationType,
          variables,
          outboxOptions,
        );

        setIsPending(false);

        if (enqueueRes.isFailure) {
          // If storage enqueue failed, rollback optimistic state
          rollbackOptimistic(optimisticCtx);
          setIsError(true);
          const failureResult = VKResult.failure<TData>(enqueueRes.errors[0]);
          setResult(failureResult);
          if (onResultFailure) {
            await onResultFailure(enqueueRes.errors, variables);
          }
          return failureResult;
        }

        // Successfully enqueued offline
        setIsSuccess(true);
        setIsQueued(true);
        const queuedResult = VKResult.success<TData>(undefined as unknown as TData);
        setResult(queuedResult);
        if (onResultSuccess) {
          await onResultSuccess(undefined, variables, true);
        }
        return queuedResult;
      }

      // [Online Path]: Attempt live execution
      try {
        const liveResult = await mutationFn(variables);

        setIsPending(false);

        if (liveResult.isSuccess) {
          setIsSuccess(true);
          setResult(liveResult);
          await invalidateQueries(optimisticCtx, variables);
          if (onResultSuccess) {
            await onResultSuccess(liveResult.value, variables, false);
          }
          return liveResult;
        }

        // Mutation returned a failure
        // If it was a network / transient error, fallback into outbox!
        const isNetworkOrTransient = liveResult.errors.some(
          (err) =>
            err.code.includes('Network') ||
            err.code.includes('Timeout') ||
            err.code.includes('Unavailable'),
        );

        if (isNetworkOrTransient) {
          const enqueueRes = await outboxManager.enqueue(
            mutationType,
            variables,
            outboxOptions,
          );
          if (enqueueRes.isSuccess) {
            setIsSuccess(true);
            setIsQueued(true);
            const queuedResult = VKResult.success<TData>(undefined as unknown as TData);
            setResult(queuedResult);
            if (onResultSuccess) {
              await onResultSuccess(undefined, variables, true);
            }
            return queuedResult;
          }
        }

        // Non-retryable or fatal error: rollback optimistic cache
        rollbackOptimistic(optimisticCtx);
        setIsError(true);
        setResult(liveResult);
        if (onResultFailure) {
          await onResultFailure(liveResult.errors, variables);
        }
        return liveResult;
      } catch (thrown: unknown) {
        setIsPending(false);

        // Network exception caught: attempt offline outbox fallback
        const enqueueRes = await outboxManager.enqueue(
          mutationType,
          variables,
          outboxOptions,
        );

        if (enqueueRes.isSuccess) {
          setIsSuccess(true);
          setIsQueued(true);
          const queuedResult = VKResult.success<TData>(undefined as unknown as TData);
          setResult(queuedResult);
          if (onResultSuccess) {
            await onResultSuccess(undefined, variables, true);
          }
          return queuedResult;
        }

        // Fallback failed or rejected: rollback
        rollbackOptimistic(optimisticCtx);
        setIsError(true);
        const errMsg = thrown instanceof Error ? thrown.message : String(thrown);
        const failureResult = VKResult.failure<TData>(
          VKError.failure('Query.Outbox.ExecutionFailed', errMsg),
        );
        setResult(failureResult);
        if (onResultFailure) {
          await onResultFailure(failureResult.errors, variables);
        }
        return failureResult;
      }
    },
    [
      applyOptimistic,
      outboxManager,
      mutationType,
      outboxOptions,
      rollbackOptimistic,
      onResultFailure,
      onResultSuccess,
      mutationFn,
      invalidateQueries,
    ],
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      void mutateAsync(variables);
    },
    [mutateAsync],
  );

  const reset = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setIsQueued(false);
    setResult(undefined);
  }, []);

  const value = result?.isSuccess ? result.value : undefined;
  const errors = result?.isFailure ? result.errors : [];

  return {
    mutate,
    mutateAsync,
    isPending,
    isSuccess,
    isError,
    isQueued,
    result,
    value,
    errors,
    reset,
  };
}
