// [AP.01] Stage chunking algorithm mirroring backend VKPipelineRunner.ChunkStages
import { vkAssert } from '../assert/index.js';

/**
 * Chunks stages into execution batches based on ordering and optional parallel grouping.
 * Consecutive stages sharing the same non-null parallelGroup or identical order will be grouped into one chunk.
 */
export function chunkStages<T>(
  stages: readonly T[],
  orderSelector: (stage: T) => number,
  parallelGroupSelector: (stage: T) => number | string | undefined | null,
): T[][] {
  vkAssert.notNull(stages, 'stages');
  vkAssert.notNull(orderSelector, 'orderSelector');
  vkAssert.notNull(parallelGroupSelector, 'parallelGroupSelector');

  if (stages.length === 0) {
    return [];
  }

  // Sort ascending by order
  const sorted = [...stages].sort((a, b) => orderSelector(a) - orderSelector(b));
  const chunks: T[][] = [];
  let currentChunk: T[] | null = null;

  for (const stage of sorted) {
    if (currentChunk === null) {
      currentChunk = [stage];
      chunks.push(currentChunk);
    } else {
      const prev = currentChunk[currentChunk.length - 1];
      if (prev === undefined) {
        currentChunk.push(stage);
        continue;
      }

      const currentGroup = parallelGroupSelector(stage);
      const prevGroup = parallelGroupSelector(prev);
      const currentOrder = orderSelector(stage);
      const prevOrder = orderSelector(prev);

      const hasMatchingGroup =
        currentGroup != null &&
        prevGroup != null &&
        currentGroup === prevGroup;

      const hasMatchingOrder = currentOrder === prevOrder;

      if (hasMatchingGroup || hasMatchingOrder) {
        currentChunk.push(stage);
      } else {
        currentChunk = [stage];
        chunks.push(currentChunk);
      }
    }
  }

  return chunks;
}
