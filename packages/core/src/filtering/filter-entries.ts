// [CS.01] Filter array of entries using the entry filter chain
// [CS.03] Async execution with cancellation propagation
// [AP.01] Strict null checks without non-null assertion operators
import { VKResult } from '../result/index.js';
import { vkAssert } from '../assert/index.js';
import type { VKEntryFilter } from './filtering.types.js';
import { VKFilterVerdict } from './filtering.constants.js';
import { applyFilters } from './apply-filters.js';

/**
 * Filters an array of entries using the given filter chain.
 * Returns a new array containing only entries whose evaluation verdict is Keep or ForceKeep.
 */
export async function filterEntries<TEntry, TContext = void>(
  entries: readonly TEntry[],
  filters: readonly VKEntryFilter<TEntry, TContext>[],
  context: TContext,
  signal?: AbortSignal,
): Promise<VKResult<TEntry[]>> {
  vkAssert.notNull(entries, 'entries');
  vkAssert.notNull(filters, 'filters');

  if (entries.length === 0 || filters.length === 0) {
    return VKResult.success([...entries]);
  }

  const resultList: TEntry[] = [];

  for (const entry of entries) {
    const verdictResult = await applyFilters(filters, entry, context, signal);
    if (verdictResult.isFailure) {
      return VKResult.failureMany(verdictResult.errors);
    }

    if (
      verdictResult.value === VKFilterVerdict.Keep ||
      verdictResult.value === VKFilterVerdict.ForceKeep
    ) {
      resultList.push(entry);
    }
  }

  return VKResult.success(resultList);
}
