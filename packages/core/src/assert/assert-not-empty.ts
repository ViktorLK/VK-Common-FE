// [AP.01] Modern TypeScript assertion function
// [CS.01] Invariant failures throw standard VKError
import { VKError } from '../errors/vk-error.js';
import { VKAssertErrorCodes } from './assert.errors.js';

/**
 * Asserts that a string is not empty or whitespace.
 */
export function assertNotEmpty(
  value: string | null | undefined,
  paramName?: string,
): asserts value is string {
  if (value === null || value === undefined || value.trim() === '') {
    throw VKError.failure(
      VKAssertErrorCodes.EmptyString,
      `vkAssert: ${paramName ?? 'String'} cannot be null, empty, or whitespace.`,
    );
  }
}
