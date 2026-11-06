import { useQuery, UseQueryOptions, UseQueryResult, QueryKey } from '@tanstack/react-query';
import { VKResult, VKError } from '@vk-blocks/core';

export interface UseVKQueryOptions<TData, TQueryKey extends QueryKey = QueryKey>
  extends Omit<UseQueryOptions<VKResult<TData>, Error, VKResult<TData>, TQueryKey>, 'queryKey' | 'queryFn'> {
  readonly queryKey: TQueryKey;
  readonly queryFn: (context: { signal: AbortSignal }) => Promise<VKResult<TData>>;
  /** Optional entity tags for declarative tag-based cache invalidation. Injected into query.meta.tags. */
  readonly tags?: readonly string[];
}

export interface UseVKQueryResult<TData> extends Omit<UseQueryResult<VKResult<TData>, Error>, 'data'> {
  /** The full VKResult returned by the query function. */
  readonly result: VKResult<TData> | undefined;
  /** The extracted value if the result was successful, otherwise undefined. */
  readonly value: TData | undefined;
  /** The errors if the result failed, otherwise empty array. */
  readonly errors: readonly VKError[];
  /** True if the query completed and the operation was successful. */
  readonly isResultSuccess: boolean;
  /** True if the query completed and the operation was a failure. */
  readonly isResultFailure: boolean;
}

/**
 * Industrial-grade wrapper around TanStack Query's useQuery specifically tailored for VKResult<T>.
 * Ensures full type-safety without requiring manual unwrap logic.
 */
export function useVKQuery<TData, TQueryKey extends QueryKey = QueryKey>(
  options: UseVKQueryOptions<TData, TQueryKey>
): UseVKQueryResult<TData> {
  const { queryKey, queryFn, tags, ...rest } = options;

  const mergedMeta = {
    ...rest.meta,
    ...(tags && tags.length > 0 ? { tags } : {}),
  };

  const query = useQuery<VKResult<TData>, Error, VKResult<TData>, TQueryKey>({
    queryKey,
    queryFn: ({ signal }) => queryFn({ signal }),
    ...rest,
    meta: mergedMeta,
  });

  const result = query.data;
  const isResultSuccess = Boolean(result?.isSuccess);
  const isResultFailure = Boolean(result?.isFailure);
  const value = result?.isSuccess ? result.value : undefined;
  const errors = result?.isFailure ? result.errors : [];

  return {
    ...query,
    result,
    value,
    errors,
    isResultSuccess,
    isResultFailure,
  };
}
