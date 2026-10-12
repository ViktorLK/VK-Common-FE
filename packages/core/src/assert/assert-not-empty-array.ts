// [AP.01] Modern TypeScript assertion function
// [CS.01] Invariant failures throw standard VKError
import { VKError } from '../errors/vk-error.js';
import { VKAssertErrorCodes } from './assert.errors.js';

/**
 * Asserts that an array has at least one element.
 */
export function assertNotEmptyArray<T>(
  value: readonly T[] | null | undefined,
  paramName?: string,
): asserts value is readonly [T, ...T[]] {
  if (value === null || value === undefined || value.length === 0) {
    throw VKError.failure(
      VKAssertErrorCodes.EmptyArray,
      `vkAssert: ${paramName ?? 'Array'} cannot be null or empty.`,
    );
  }
}
