// [MB.02] Explicit barrel export
export { VKResult, type VKVoidResult } from './vk-result.js';
export {
  vkOk,
  vkErr,
  vkIsOk,
  vkIsErr,
  vkFromPromise,
  vkUnwrapOrThrow,
} from './result-constructors.js';
export type {
  VKOk,
  VKErr,
  VKVoidOk,
  VKVoidErr,
  VKEither,
} from './result.types.js';
export { VKResultErrorCodes } from './result.errors.js';

