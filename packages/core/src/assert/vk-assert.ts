// [AP.01] Modern TypeScript assertion functions (asserts condition)
// [CS.01] Invariant failures throw standard VKError
import { assertCondition } from './assert-condition.js';
import { assertDefined } from './assert-defined.js';
import { assertNotEmpty } from './assert-not-empty.js';
import { assertNotEmptyArray } from './assert-not-empty-array.js';
import { assertDefinedInEnum } from './assert-defined-in-enum.js';
import { vkAssertNever, assertNever } from './assert-never.js';

export {
  assertCondition,
  assertDefined,
  assertNotEmpty,
  assertNotEmptyArray,
  assertDefinedInEnum,
  vkAssertNever,
  assertNever,
};


export interface VKAssert {
  (condition: unknown, message?: string): asserts condition;
  /**
   * Asserts the value is not null or undefined, returning the value for chaining.
   */
  notNull<T>(value: T | null | undefined, paramName?: string): T;
  /**
   * Asserts the string is not empty or whitespace, returning the value.
   */
  notEmpty(value: string | null | undefined, paramName?: string): string;
  /**
   * Asserts the array has at least one element, returning the value.
   */
  notEmptyArray<T>(value: readonly T[] | null | undefined, paramName?: string): readonly T[];
  /**
   * Asserts a value is defined in a const enum-like object, returning the value.
   */
  defined<T extends Record<string, unknown>>(enumObj: T, value: unknown, paramName?: string): T[keyof T];
  /**
   * Exhaustive check.
   */
  exhaustive(value: never, message?: string): never;
}

/**
 * Base callable vkAssert function with helper methods attached.
 */
function vkAssertFn(condition: unknown, message?: string): asserts condition {
  assertCondition(condition, message);
}

export const vkAssert: VKAssert = Object.assign(vkAssertFn, {
  notNull: <T>(value: T | null | undefined, paramName?: string): T => {
    assertDefined(value, paramName);
    return value;
  },

  notEmpty: (value: string | null | undefined, paramName?: string): string => {
    assertNotEmpty(value, paramName);
    return value;
  },

  notEmptyArray: <T>(value: readonly T[] | null | undefined, paramName?: string): readonly T[] => {
    assertNotEmptyArray(value, paramName);
    return value;
  },

  defined: <T extends Record<string, unknown>>(enumObj: T, value: unknown, paramName?: string): T[keyof T] => {
    assertDefinedInEnum(enumObj, value, paramName);
    return value as T[keyof T];
  },

  exhaustive: assertNever,
});
