import { describe, it, expect } from 'vitest';
import { isNonEmptyArray } from './is-non-empty-array.js';

describe('isNonEmptyArray', () => {
  it('identifies non-empty arrays', () => {
    expect(isNonEmptyArray([1])).toBe(true);
    expect(isNonEmptyArray([])).toBe(false);
    expect(isNonEmptyArray(null)).toBe(false);
  });
});
