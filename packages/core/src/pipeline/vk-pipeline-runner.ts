// [CS.01] Universal pipeline execution engine returning typed VKResult
// [CS.03] Async execution with cancellation propagation via AbortSignal
// [AP.03] Standardized typing with VKPipelineStage
import { VKResult } from '../result/index.js';
import { VKError, toVKError } from '../errors/index.js';
import { vkAssert } from '../assert/index.js';
import type { VKPipelineStage, VKPipelineOptions } from './pipeline.types.js';
import { VKPipelineErrorCodes } from './pipeline.errors.js';
import { chunkStages } from './chunk-stages.js';

export class VKPipelineRunner {
  /**
   * Executes a collection of pipeline stages with ordering, parallel chunking, abort check, and short-circuiting.
   */
  static async execute<TContext, TResult = void>(
    stages: readonly VKPipelineStage<TContext, TResult>[],
    context: TContext,
    options?: VKPipelineOptions<TContext, TResult>,
  ): Promise<VKResult<TResult>> {
    vkAssert.notNull(stages, 'stages');
    vkAssert.notNull(context, 'context');

    const activeStages = stages.filter((s) => s.isActive !== false);
    const totalCount = activeStages.length;

    if (totalCount === 0) {
      return VKResult.success(options?.defaultResult as TResult);
    }

    const chunks = chunkStages(
      activeStages,
      (s) => s.schedule.order,
      (s) => s.schedule.parallelGroup,
    );

    let lastResult: TResult = options?.defaultResult as TResult;
    let completedStagesCount = 0;

    for (const chunk of chunks) {
      // Check cancellation signal
      if (options?.signal?.aborted) {
        return VKResult.failure(
          VKError.failure(
            VKPipelineErrorCodes.Cancelled,
            'Pipeline execution was cancelled via AbortSignal.',
          ),
        );
      }

      // Check custom abort predicate
      if (options?.isAborted && options.isAborted(context)) {
        return VKResult.failure(
          VKError.failure(
            VKPipelineErrorCodes.Aborted,
            'Pipeline execution was aborted by condition.',
          ),
        );
      }

      // If chunk has multiple stages and they allow parallel execution (either same parallelGroup or isParallel flag)
      const isParallelChunk =
        chunk.length > 1 &&
        chunk.every((s) => s.schedule.parallelGroup != null || s.schedule.isParallel === true);

      if (isParallelChunk) {
        // Execute stages in parallel via Promise.all
        const stagePromises = chunk.map(async (stage) => {
          try {
            return await stage.execute(context, options?.signal);
          } catch (err) {
            return VKResult.failure<TResult>(toVKError(err, VKPipelineErrorCodes.StageFailed));
          }
        });

        const results = await Promise.all(stagePromises);

        for (let i = 0; i < results.length; i++) {
          const res = results[i];
          const stage = chunk[i];
          if (!res || !stage) continue;

          if (res.isFailure) {
            return res;
          }

          completedStagesCount++;
          lastResult = res.value;

          options?.onProgress?.({
            currentStageIndex: completedStagesCount,
            totalStages: totalCount,
            currentStageId: stage.id,
            context,
            percentage: Math.round((completedStagesCount / totalCount) * 100),
          });

          if (options?.shouldShortCircuit && options.shouldShortCircuit(res.value)) {
            return res;
          }
        }
      } else {
        // Execute stages sequentially
        for (const stage of chunk) {
          if (options?.signal?.aborted) {
            return VKResult.failure(
              VKError.failure(
                VKPipelineErrorCodes.Cancelled,
                'Pipeline execution was cancelled via AbortSignal.',
              ),
            );
          }

          if (options?.isAborted && options.isAborted(context)) {
            return VKResult.failure(
              VKError.failure(
                VKPipelineErrorCodes.Aborted,
                'Pipeline execution was aborted by condition.',
              ),
            );
          }

          let res: VKResult<TResult>;
          try {
            res = await stage.execute(context, options?.signal);
          } catch (err) {
            return VKResult.failure<TResult>(toVKError(err, VKPipelineErrorCodes.StageFailed));
          }

          if (res.isFailure) {
            return res;
          }

          completedStagesCount++;
          lastResult = res.value;

          options?.onProgress?.({
            currentStageIndex: completedStagesCount,
            totalStages: totalCount,
            currentStageId: stage.id,
            context,
            percentage: Math.round((completedStagesCount / totalCount) * 100),
          });

          if (options?.shouldShortCircuit && options.shouldShortCircuit(res.value)) {
            return res;
          }
        }
      }
    }

    return VKResult.success(lastResult);
  }
}

export const createVKPipelineRunner = (): typeof VKPipelineRunner => VKPipelineRunner;
