// [AP.01] Modern TypeScript assertion function
// [CS.01] Invariant failures throw standard VKError
import { VKError } from '../errors/vk-error.js';
import { VKAssertErrorCodes } from './assert.errors.js';

/**
 * Asserts that a value is defined (not null and not undefined).
 */
export function assertDefined<T>(
  value: T | null | undefined,
  paramName?: string,
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw VKError.failure(
      VKAssertErrorCodes.NullOrUndefined,
      `vkAssert: ${paramName ?? 'Value'} cannot be null or undefined.`,
    );
  }
}
