// [CS.01] Centralized Error codes for pipeline slice

export const VKPipelineErrorCodes = {
  Aborted: 'Core.Pipeline.Aborted',
  Cancelled: 'Core.Pipeline.Cancelled',
  StageFailed: 'Core.Pipeline.StageFailed',
  EmptyPipeline: 'Core.Pipeline.EmptyPipeline',
  MultipleNextCalls: 'Core.Pipeline.MultipleNextCalls',
} as const;
