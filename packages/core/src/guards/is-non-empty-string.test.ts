import { describe, it, expect } from 'vitest';
import { isNonEmptyString } from './is-non-empty-string.js';

describe('isNonEmptyString', () => {
  it('identifies non-empty trimmed strings', () => {
    expect(isNonEmptyString('hello')).toBe(true);
    expect(isNonEmptyString('   ')).toBe(false);
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
  });
});
