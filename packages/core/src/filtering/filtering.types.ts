// [BASE-01] Contract-First: Entry Filter Protocol Abstractions
// [CS.01] All filters return VKResult<VKFilterVerdict>
import type { VKResult } from '../result/index.js';

export type VKFilterVerdictType = 'reject' | 'keep' | 'force-keep';

export interface VKEntryFilter<TEntry, TContext = void> {
  /**
   * Execution order of the filter. Lower values execute first.
   */
  readonly filterOrder: number;

  /**
   * Evaluates if the entry matches the filter criteria.
   */
  filter(
    entry: TEntry,
    context: TContext,
    signal?: AbortSignal,
  ): Promise<VKResult<VKFilterVerdictType>> | VKResult<VKFilterVerdictType>;
}
