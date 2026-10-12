// [AP.01] Exhaustive switch check
// [CS.01] Invariant failures throw standard VKError
import { VKError } from '../errors/vk-error.js';
import { VKAssertErrorCodes } from './assert.errors.js';
import { safeJsonStringify } from '../internal/serialization/safe-json-stringify.js';

/**
 * Exhaustive switch check. Place in default case of discriminated union switches.
 */
export function vkAssertNever(value: never, message?: string): never {
  throw VKError.failure(
    VKAssertErrorCodes.ExhaustiveMatchFailed,
    message ?? `vkAssert: Exhaustive match failed. Unhandled value: ${safeJsonStringify(value)}`,
  );
}

/**
 * @deprecated Use vkAssertNever instead per naming convention.
 */
export const assertNever = vkAssertNever;

