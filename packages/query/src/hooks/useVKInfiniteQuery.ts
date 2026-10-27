// [AP.04] [FS-08] [CS.01] [AP.01] Cursor-Aware Infinite Query Stream Hook for TanStack Query
import { useMemo } from 'react';
import {
  useInfiniteQuery,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type QueryKey,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  type VKResult,
  type VKError,
  vkAssert,
} from '@vk-blocks/core';

export interface UseVKInfiniteQueryOptions<
  TPage,
  TItem = unknown,
  TPageParam = unknown,
  TQueryKey extends QueryKey = QueryKey,
> extends Omit<
    UseInfiniteQueryOptions<
      VKResult<TPage>,
      Error,
      InfiniteData<VKResult<TPage>, TPageParam>,
      TQueryKey,
      TPageParam
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'getPreviousPageParam' | 'initialPageParam'
  > {
  readonly queryKey: TQueryKey;
  readonly initialPageParam: TPageParam;
  readonly queryFn: (context: {
    readonly pageParam: TPageParam;
    readonly signal: AbortSignal;
  }) => Promise<VKResult<TPage>>;
  /**
   * Optional custom resolver to extract the next page parameter.
   * By default, automatically checks `nextCursor` in VKCursorPagedResult or `hasNextPage` in VKPagedResult.
   */
  readonly getNextPageParam?: (
    lastPage: VKResult<TPage>,
    allPages: readonly VKResult<TPage>[],
    lastPageParam: TPageParam,
  ) => TPageParam | undefined;
  /**
   * Optional custom resolver to extract the previous page parameter.
   * By default, automatically checks `prevCursor` in VKCursorPagedResult or `hasPreviousPage` in VKPagedResult.
   */
  readonly getPreviousPageParam?: (
    firstPage: VKResult<TPage>,
    allPages: readonly VKResult<TPage>[],
    firstPageParam: TPageParam,
  ) => TPageParam | undefined;
  /**
   * Optional extractor to extract an item array from a page.
   * Defaults to accessing `page.items`.
   */
  readonly extractItems?: (page: TPage) => readonly TItem[];
  /**
   * Optional entity tags for declarative tag-based cache invalidation. Injected into query.meta.tags.
   */
  readonly tags?: readonly string[];
}

export interface UseVKInfiniteQueryResult<TPage, TItem = unknown, TPageParam = unknown>
  extends Omit<
    UseInfiniteQueryResult<InfiniteData<VKResult<TPage>, TPageParam>, Error>,
    'data'
  > {
  /** The full InfiniteData envelope of VKResult pages. */
  readonly data: InfiniteData<VKResult<TPage>, TPageParam> | undefined;
  /** All successfully fetched page value payloads. */
  readonly pages: readonly TPage[];
  /** Flattened list of items across all fetched pages for immediate virtual list binding. */
  readonly items: readonly TItem[];
  /** Errors collected from any failed page results. */
  readonly errors: readonly VKError[];
  /** True if any page result returned a typed VKResult.failure. */
  readonly hasPageFailure: boolean;
}

function defaultGetNextPageParam<TPage, TPageParam>(
  lastPageResult: VKResult<TPage>,
): TPageParam | undefined {
  if (!lastPageResult.isSuccess || !lastPageResult.value) {
    return undefined;
  }
  const page = lastPageResult.value as unknown as Record<string, unknown>;

  // 1. VKCursorPagedResult: check nextCursor & hasMore
  if ('nextCursor' in page && page.nextCursor !== undefined && page.nextCursor !== null) {
    if ('hasMore' in page && page.hasMore === false) {
      return undefined;
    }
    return page.nextCursor as TPageParam;
  }

  // 2. VKPagedResult: check hasNextPage & page number
  if ('hasNextPage' in page && page.hasNextPage && typeof page.page === 'number') {
    return (page.page + 1) as TPageParam;
  }

  return undefined;
}

function defaultGetPreviousPageParam<TPage, TPageParam>(
  firstPageResult: VKResult<TPage>,
): TPageParam | undefined {
  if (!firstPageResult.isSuccess || !firstPageResult.value) {
    return undefined;
  }
  const page = firstPageResult.value as unknown as Record<string, unknown>;

  // 1. VKCursorPagedResult: check prevCursor
  if ('prevCursor' in page && page.prevCursor !== undefined && page.prevCursor !== null) {
    return page.prevCursor as TPageParam;
  }

  // 2. VKPagedResult: check hasPreviousPage & page number
  if (
    'hasPreviousPage' in page &&
    page.hasPreviousPage &&
    typeof page.page === 'number' &&
    page.page > 1
  ) {
    return (page.page - 1) as TPageParam;
  }

  return undefined;
}

/**
 * Enterprise-grade infinite query stream hook wrapping TanStack Query's useInfiniteQuery (AP.04 / FS-08).
 * Provides automated cursor extraction, flat item list unwrapping, and tag-based invalidation meta.
 */
export function useVKInfiniteQuery<
  TPage,
  TItem = unknown,
  TPageParam = unknown,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseVKInfiniteQueryOptions<TPage, TItem, TPageParam, TQueryKey>,
): UseVKInfiniteQueryResult<TPage, TItem, TPageParam> {
  vkAssert.notNull(options, 'options');
  vkAssert.notNull(options.queryKey, 'options.queryKey');
  vkAssert.notNull(options.queryFn, 'options.queryFn');

  const {
    queryKey,
    initialPageParam,
    queryFn,
    getNextPageParam = defaultGetNextPageParam,
    getPreviousPageParam = defaultGetPreviousPageParam,
    extractItems,
    tags,
    ...rest
  } = options;

  const mergedMeta = {
    ...rest.meta,
    ...(tags && tags.length > 0 ? { tags } : {}),
  };

  const query = useInfiniteQuery<
    VKResult<TPage>,
    Error,
    InfiniteData<VKResult<TPage>, TPageParam>,
    TQueryKey,
    TPageParam
  >({
    queryKey,
    initialPageParam,
    queryFn: ({ pageParam, signal }) =>
      queryFn({ pageParam: pageParam as TPageParam, signal }),
    getNextPageParam: (lastPage, allPages, lastPageParam) =>
      getNextPageParam(lastPage, allPages, lastPageParam),
    getPreviousPageParam: (firstPage, allPages, firstPageParam) =>
      getPreviousPageParam(firstPage, allPages, firstPageParam),
    ...rest,
    meta: mergedMeta,
  });

  const { pages, items, errors, hasPageFailure } = useMemo(() => {
    const pagesAccum: TPage[] = [];
    const itemsAccum: TItem[] = [];
    const errorsAccum: VKError[] = [];
    let failureFound = false;

    if (query.data?.pages) {
      for (const pageResult of query.data.pages) {
        if (pageResult.isSuccess && pageResult.value) {
          pagesAccum.push(pageResult.value);
          if (extractItems) {
            itemsAccum.push(...extractItems(pageResult.value));
          } else if (
            typeof pageResult.value === 'object' &&
            pageResult.value !== null &&
            'items' in pageResult.value &&
            Array.isArray((pageResult.value as Record<string, unknown>).items)
          ) {
            itemsAccum.push(
              ...((pageResult.value as Record<string, unknown>).items as readonly TItem[]),
            );
          }
        } else if (pageResult.isFailure) {
          failureFound = true;
          errorsAccum.push(...pageResult.errors);
        }
      }
    }

    return {
      pages: pagesAccum,
      items: itemsAccum,
      errors: errorsAccum,
      hasPageFailure: failureFound,
    };
  }, [query.data, extractItems]);

  return {
    ...query,
    pages,
    items,
    errors,
    hasPageFailure,
  };
}
