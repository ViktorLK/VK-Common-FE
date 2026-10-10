import { describe, it, expect } from 'vitest';
import { isDefined } from './is-defined.js';

describe('isDefined', () => {
  it('identifies non-null values', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });
});
