// [MB.02] Explicit barrel export
export { VKError } from './vk-error.js';
export {
  VKErrorCategory,
  VKErrorType,
  VKCoreErrorCodes,
} from './errors.constants.js';
export type {
  VKProblemDetails,
  VKFieldError,
  VKErrorOptions,
  VKErrorSeverity,
} from './errors.types.js';
export { VKCoreErrors } from './vk-core-errors.js';
export { toVKError } from './to-vk-error.js';

