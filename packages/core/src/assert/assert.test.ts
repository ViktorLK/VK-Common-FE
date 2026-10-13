import { describe, it, expect } from 'vitest';
import {
  vkAssert,
  assertCondition,
  assertDefined,
  assertNotEmpty,
  assertNotEmptyArray,
  assertDefinedInEnum,
  assertNever,
} from './index.js';
import { VKError } from '../errors/vk-error.js';

describe('assert', () => {
  it('callable vkAssert passes for truthy and throws VKError for falsy', () => {
    expect(() => vkAssert(true)).not.toThrow();
    expect(() => vkAssert(false, 'Bad condition')).toThrowError(VKError);
  });

  it('assertDefined checks null and undefined', () => {
    let val: string | null = 'hello';
    assertDefined(val);
    expect(val).toBe('hello');

    expect(() => assertDefined(null)).toThrowError(VKError);
    expect(() => assertDefined(undefined)).toThrowError(VKError);
  });

  it('assertNotEmpty checks empty string', () => {
    expect(() => assertNotEmpty('valid')).not.toThrow();
    expect(() => assertNotEmpty('')).toThrowError(VKError);
    expect(() => assertNotEmpty('   ')).toThrowError(VKError);
  });

  it('assertNotEmptyArray checks array elements', () => {
    expect(() => assertNotEmptyArray([1])).not.toThrow();
    expect(() => assertNotEmptyArray([])).toThrowError(VKError);
  });

  it('assertDefinedInEnum checks valid enum value', () => {
    const Colors = { Red: 'red', Green: 'green' } as const;
    expect(() => assertDefinedInEnum(Colors, 'red')).not.toThrow();
    expect(() => assertDefinedInEnum(Colors, 'blue')).toThrowError(VKError);
  });

  it('assertNever throws VKError', () => {
    expect(() => assertNever('unexpected' as never)).toThrowError(VKError);
  });

  it('vkAssert chained helpers return value and throw VKError on failure', () => {
    expect(vkAssert.notNull('good')).toBe('good');
    expect(() => vkAssert.notNull(null)).toThrowError(VKError);

    expect(vkAssert.notEmpty('abc')).toBe('abc');
    expect(() => vkAssert.notEmpty('')).toThrowError(VKError);

    expect(vkAssert.notEmptyArray([1, 2])).toEqual([1, 2]);
    expect(() => vkAssert.notEmptyArray([])).toThrowError(VKError);
  });
});
