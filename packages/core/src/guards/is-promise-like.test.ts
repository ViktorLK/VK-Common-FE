import { describe, it, expect } from 'vitest';
import { isPromiseLike } from './is-promise-like.js';

describe('isPromiseLike', () => {
  it('identifies thenable objects', () => {
    expect(isPromiseLike(Promise.resolve(1))).toBe(true);
    expect(isPromiseLike({ then: () => {} })).toBe(true);
    expect(isPromiseLike({})).toBe(false);
    expect(isPromiseLike(null)).toBe(false);
  });
});
