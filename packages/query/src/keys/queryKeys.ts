/**
 * Standardized QueryKey factory contract for VK.Blocks applications.
 */
export interface VKQueryKeyFactory<TRoot extends string> {
  readonly all: readonly [TRoot];
  readonly lists: () => readonly [TRoot, 'list'];
  readonly list: (params?: Record<string, unknown>) => readonly [TRoot, 'list', Record<string, unknown> | undefined];
  readonly details: () => readonly [TRoot, 'detail'];
  readonly detail: (id: string | number) => readonly [TRoot, 'detail', string | number];
}

/**
 * Creates a structured, standardized QueryKey hierarchy for a given resource.
 * This guarantees consistent cache invalidation and query deduplication.
 */
export function createVKQueryKey<TRoot extends string>(root: TRoot): VKQueryKeyFactory<TRoot> {
  return {
    all: [root] as const,
    lists: () => [root, 'list'] as const,
    list: (params?: Record<string, unknown>) => [root, 'list', params] as const,
    details: () => [root, 'detail'] as const,
    detail: (id: string | number) => [root, 'detail', id] as const,
  };
}
