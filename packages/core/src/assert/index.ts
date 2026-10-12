// [MB.02] Explicit barrel export
export type { VKAssert } from './vk-assert.js';
export {
  vkAssert,
  assertCondition,
  assertDefined,
  assertNotEmpty,
  assertNotEmptyArray,
  assertDefinedInEnum,
  vkAssertNever,
  assertNever,
} from './vk-assert.js';

export { VKAssertErrorCodes } from './assert.errors.js';
