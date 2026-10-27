// [AP.04] [AP.01] Tag-based & Wildcard Query Invalidation for TanStack Query
import type { QueryClient, Query } from '@tanstack/react-query';
import { vkAssert } from '@vk-blocks/core';

/**
 * Standard metadata structure for queries supporting entity tags.
 */
export interface VKQueryMeta {
  readonly tags?: readonly string[];
  readonly [key: string]: unknown;
}

/**
 * Configuration options for tag and wildcard invalidations.
 */
export interface VKTagInvalidateOptions {
  /**
   * Refetch type matching TanStack Query invalidation options.
   * Defaults to 'active'.
   */
  readonly refetchType?: 'active' | 'inactive' | 'all' | 'none';
}

/**
 * Invalidates all queries in the TanStack Query cache that match any of the provided tags (AP.04).
 * Resolves tags from `query.meta.tags`.
 *
 * @example
 * ```ts
 * // Invalidate all cached queries tagged with 'users' or 'tenants'
 * await invalidateQueriesByTags(queryClient, ['users', 'tenants']);
 * ```
 */
export async function invalidateQueriesByTags(
  queryClient: QueryClient,
  tags: string | readonly string[],
  options?: VKTagInvalidateOptions,
): Promise<void> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(queryClient, 'queryClient');
  vkAssert.notNull(tags, 'tags');

  const targetTags = Array.isArray(tags) ? tags : [tags];
  if (targetTags.length === 0) {
    return;
  }

  await queryClient.invalidateQueries({
    predicate: (query: Query) => {
      const meta = query.meta as VKQueryMeta | undefined;
      if (!meta?.tags || !Array.isArray(meta.tags)) {
        return false;
      }
      return targetTags.some((tag) => meta.tags!.includes(tag));
    },
    refetchType: options?.refetchType,
  });
}

/**
 * Invalidates queries matching a wildcard path pattern (e.g. 'users/*' or ['users', '*']).
 *
 * @example
 * ```ts
 * // Invalidate all sub-queries under users
 * await invalidateQueriesByWildcard(queryClient, 'users/*');
 * ```
 */
export async function invalidateQueriesByWildcard(
  queryClient: QueryClient,
  pattern: string | readonly unknown[],
  options?: VKTagInvalidateOptions,
): Promise<void> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(queryClient, 'queryClient');
  vkAssert.notNull(pattern, 'pattern');

  const patternParts: readonly unknown[] =
    typeof pattern === 'string'
      ? pattern.split('/').filter((p: string) => p.length > 0)
      : pattern;

  if (patternParts.length === 0) {
    return;
  }

  await queryClient.invalidateQueries({
    predicate: (query: Query) => {
      const queryKey = query.queryKey;
      if (patternParts.length > queryKey.length) {
        return false;
      }
      for (let i = 0; i < patternParts.length; i++) {
        const part = patternParts[i];
        if (part === '*' || part === '**') {
          return true;
        }
        if (String(queryKey[i]) !== String(part)) {
          return false;
        }
      }
      return true;
    },
    refetchType: options?.refetchType,
  });
}
