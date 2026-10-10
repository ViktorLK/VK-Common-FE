import { describe, it, expect } from 'vitest';
import { isPlainObject } from './is-plain-object.js';

describe('isPlainObject', () => {
  it('identifies object literals', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject([])).toBe(false);
  });
});
