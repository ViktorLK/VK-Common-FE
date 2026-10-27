// [AP.04] [CS.01] [AP.01] Industrial-grade useVKMutation with VKResult & Optimistic Update support
import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { vkAssert, type VKResult, type VKError } from '@vk-blocks/core';
import {
  type VKOptimisticOptions,
  createVKOptimisticCallbacks,
} from './_internal/optimistic-pipeline.js';

export interface UseVKMutationOptions<TData, TVariables = void, TQueryData = unknown>
  extends Omit<
    UseMutationOptions<VKResult<TData>, Error, TVariables, unknown>,
    'mutationFn'
  > {
  readonly mutationFn: (variables: TVariables) => Promise<VKResult<TData>>;
  /**
   * Optional optimistic update configuration with automatic snapshot rollback (AP.04).
   */
  readonly optimistic?: VKOptimisticOptions<TQueryData, TVariables>;
  /**
   * Callback fired exclusively when the mutation resolves with a successful VKResult.
   */
  readonly onResultSuccess?: (
    data: TData,
    variables: TVariables,
    context?: unknown,
  ) => Promise<unknown> | unknown;
  /**
   * Callback fired exclusively when the mutation resolves with a failed VKResult.
   */
  readonly onResultFailure?: (
    errors: readonly VKError[],
    variables: TVariables,
    context?: unknown,
  ) => Promise<unknown> | unknown;
}

export interface UseVKMutationResult<TData, TVariables = void>
  extends Omit<UseMutationResult<VKResult<TData>, Error, TVariables, unknown>, 'data'> {
  /** The full VKResult returned by the mutation function. */
  readonly result: VKResult<TData> | undefined;
  /** The extracted value if mutation succeeded. */
  readonly value: TData | undefined;
  /** The errors if mutation failed. */
  readonly errors: readonly VKError[];
  /** True if mutation finished and resulted in success. */
  readonly isResultSuccess: boolean;
  /** True if mutation finished and resulted in failure. */
  readonly isResultFailure: boolean;
}

/**
 * Industrial-grade wrapper around TanStack Query's useMutation tailored for VKResult<T>.
 * Supports declarative optimistic updates with automatic snapshot rollback.
 */
export function useVKMutation<TData, TVariables = void, TQueryData = unknown>(
  options: UseVKMutationOptions<TData, TVariables, TQueryData>,
): UseVKMutationResult<TData, TVariables> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(options, 'options');
  vkAssert.notNull(options.mutationFn, 'options.mutationFn');

  const queryClient = useQueryClient();
  const {
    mutationFn,
    optimistic,
    onResultSuccess,
    onResultFailure,
    onMutate,
    onError,
    onSuccess,
    onSettled,
    ...rest
  } = options;

  let mutationOptions: UseMutationOptions<VKResult<TData>, Error, TVariables, unknown>;

  if (optimistic) {
    const optimisticCallbacks = createVKOptimisticCallbacks<TData, TVariables, TQueryData>(
      queryClient,
      optimistic,
      {
        onMutate,
        onError,
        onResultSuccess,
        onResultFailure,
        onSettled,
      },
    );

    mutationOptions = {
      mutationFn,
      onMutate: optimisticCallbacks.onMutate,
      onError: optimisticCallbacks.onError,
      onSuccess: async (result, variables, onMutateResult, mutationContext) => {
        await optimisticCallbacks.onSuccess(
          result,
          variables,
          onMutateResult,
          mutationContext,
        );
        if (onSuccess) {
          const userCtx = (
            onMutateResult as { readonly userContext?: unknown } | undefined
          )?.userContext;
          await onSuccess(result, variables, userCtx, mutationContext);
        }
      },
      onSettled: optimisticCallbacks.onSettled,
      ...rest,
    };
  } else {
    mutationOptions = {
      mutationFn,
      onMutate,
      onError,
      onSuccess: async (result, variables, onMutateResult, mutationContext) => {
        if (result.isSuccess && onResultSuccess) {
          await onResultSuccess(result.value, variables, onMutateResult);
        } else if (result.isFailure && onResultFailure) {
          await onResultFailure(result.errors, variables, onMutateResult);
        }
        if (onSuccess) {
          await onSuccess(result, variables, onMutateResult, mutationContext);
        }
      },
      onSettled,
      ...rest,
    };
  }

  const mutation = useMutation<VKResult<TData>, Error, TVariables, unknown>(mutationOptions);

  const result = mutation.data;
  const isResultSuccess = Boolean(result?.isSuccess);
  const isResultFailure = Boolean(result?.isFailure);
  const value = result?.isSuccess ? result.value : undefined;
  const errors = result?.isFailure ? result.errors : [];

  return {
    ...mutation,
    result,
    value,
    errors,
    isResultSuccess,
    isResultFailure,
  };
}
