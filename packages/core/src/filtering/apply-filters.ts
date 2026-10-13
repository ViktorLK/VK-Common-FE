// [CS.01] Chain execution for entry filters with short-circuiting on ForceKeep and Reject
// [CS.03] Async execution with cancellation propagation
import { VKResult } from '../result/index.js';
import { VKError, toVKError } from '../errors/index.js';
import { vkAssert } from '../assert/index.js';
import type { VKEntryFilter, VKFilterVerdictType } from './filtering.types.js';
import { VKFilterVerdict } from './filtering.constants.js';
import { VKFilteringErrorCodes } from './filtering.errors.js';

/**
 * Applies a chain of filters sequentially on a given entry and context.
 * Filters are sorted by filterOrder. Short-circuits immediately on ForceKeep or Reject.
 */
export async function applyFilters<TEntry, TContext = void>(
  filters: readonly VKEntryFilter<TEntry, TContext>[],
  entry: TEntry,
  context: TContext,
  signal?: AbortSignal,
): Promise<VKResult<VKFilterVerdictType>> {
  vkAssert.notNull(filters, 'filters');
  vkAssert.notNull(entry, 'entry');

  if (filters.length === 0) {
    return VKResult.success(VKFilterVerdict.Keep);
  }

  // Sort ascending by filterOrder
  const sorted = [...filters].sort((a, b) => a.filterOrder - b.filterOrder);

  for (const filter of sorted) {
    if (signal?.aborted) {
      return VKResult.failure(
        VKError.failure(
          VKFilteringErrorCodes.Aborted,
          'Filter execution was cancelled via AbortSignal.',
        ),
      );
    }

    let result: VKResult<VKFilterVerdictType>;
    try {
      const evaluation = filter.filter(entry, context, signal);
      result = evaluation instanceof Promise ? await evaluation : evaluation;
    } catch (err) {
      return VKResult.failure(toVKError(err, VKFilteringErrorCodes.FilterExecutionFailed));
    }

    if (result.isFailure) {
      return result;
    }

    if (result.value === VKFilterVerdict.ForceKeep) {
      return VKResult.success(VKFilterVerdict.ForceKeep);
    }

    if (result.value === VKFilterVerdict.Reject) {
      return VKResult.success(VKFilterVerdict.Reject);
    }
  }

  return VKResult.success(VKFilterVerdict.Keep);
}
