// [MB.02] Explicit barrel export for context slice
export type {
  VKTenantId,
  VKUserId,
  VKCorrelationId,
  VKExecutionContext,
  VKAmbientContextAccessor,
} from './context.types.js';
export { VKContextConstants } from './context.constants.js';
export { VKContextErrorCodes } from './context.errors.js';
export {
  AmbientContextAccessor,
  createAmbientContext,
} from './create-ambient-context.js';
