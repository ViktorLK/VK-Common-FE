// [MB.02] Explicit barrel export
export { VKErrorType } from './vk-error-type.js';
export { VKError } from './vk-error.js';
export { VKResult } from './vk-result.js';
export type { VKVoidResult } from './vk-result.js';
export {
  map,
  bind,
  tap,
  match,
  ensure,
  mapError,
  mapAsync,
  bindAsync,
  tapAsync,
  tryCatch,
  tryCatchAsync,
} from './vk-result-extensions.js';
