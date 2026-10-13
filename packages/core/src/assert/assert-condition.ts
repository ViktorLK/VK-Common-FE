// [AP.01] Modern TypeScript assertion function
// [CS.01] Invariant failures throw standard VKError
import { VKError } from '../errors/vk-error.js';
import { VKAssertErrorCodes } from './assert.errors.js';

/**
 * Standard boundary assertion. Throws a VKError if condition is falsy.
 */
export function assertCondition(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw VKError.failure(
      VKAssertErrorCodes.AssertionFailed,
      message ?? 'Assertion failed: condition was not met.',
    );
  }
}
