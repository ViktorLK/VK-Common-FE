// [MB.02] Explicit barrel export for pipeline slice
export type {
  VKPipelineStage,
  IVKPipelineStage,
  VKPipelineStageSchedule,
  VKPipelineProgress,
  VKPipelineOptions,
} from './pipeline.types.js';
export type {
  VKNextFn,
  VKMiddleware,
  VKMiddlewareFn,
  VKOnionPipeline,
  VKOnionPipelineOptions,
} from './onion-pipeline.types.js';
export { VKPipelineConstants } from './pipeline.constants.js';
export { VKPipelineErrorCodes } from './pipeline.errors.js';
export { chunkStages } from './chunk-stages.js';
export {
  VKPipelineRunner,
  createVKPipelineRunner,
} from './vk-pipeline-runner.js';
export {
  executeOnionPipeline,
  createVKOnionPipeline,
} from './vk-onion-pipeline.js';
