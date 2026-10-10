// [BASE-01] Contract-First: Pipeline Execution Engine Contracts
// [CS.01] All stage executions return VKResult<T>
// [CS.03] Async/await with AbortSignal cancellation support
// [AP.03] VKPipelineStage naming without I prefix
import type { VKResult } from '../result/index.js';

export interface VKPipelineStageSchedule {
  /**
   * Execution ordering number. Lower values execute first.
   */
  readonly order: number;

  /**
   * Optional group identifier. Stages sharing the same parallelGroup run concurrently via Promise.all.
   */
  readonly parallelGroup?: number | string;

  /**
   * If true, stage can run in parallel with adjacent parallel-flagged stages.
   */
  readonly isParallel?: boolean;
}

export interface VKPipelineStage<TContext, TResult = void> {
  readonly id: string;
  readonly name?: string;
  readonly schedule: VKPipelineStageSchedule;
  readonly isActive?: boolean;

  /**
   * Executes the stage logic.
   */
  execute(context: TContext, signal?: AbortSignal): Promise<VKResult<TResult>>;
}

export type IVKPipelineStage<TContext, TResult = void> = VKPipelineStage<TContext, TResult>;

export interface VKPipelineProgress<TContext = unknown> {
  readonly currentStageIndex: number;
  readonly totalStages: number;
  readonly currentStageId: string;
  readonly context: TContext;
  readonly percentage: number;
}

export interface VKPipelineOptions<TContext, TResult> {
  readonly defaultResult?: TResult;
  readonly onProgress?: (progress: VKPipelineProgress<TContext>) => void;
  readonly isAborted?: (context: TContext) => boolean;
  readonly shouldShortCircuit?: (result: TResult) => boolean;
  readonly signal?: AbortSignal;
}
