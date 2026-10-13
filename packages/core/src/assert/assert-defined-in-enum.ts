// [AP.01] Modern TypeScript assertion function
// [CS.01] Invariant failures throw standard VKError
import { VKError } from '../errors/vk-error.js';
import { VKAssertErrorCodes } from './assert.errors.js';

/**
 * Asserts that a value is a member of a const enum-like object.
 */
export function assertDefinedInEnum<T extends Record<string, unknown>>(
  enumObj: T,
  value: unknown,
  paramName?: string,
): asserts value is T[keyof T] {
  const values = Object.values(enumObj);
  if (!values.includes(value as T[keyof T])) {
    throw VKError.failure(
      VKAssertErrorCodes.InvalidEnum,
      `vkAssert: ${paramName ?? 'Value'} '${String(value)}' is not defined in the provided enumeration.`,
    );
  }
}
