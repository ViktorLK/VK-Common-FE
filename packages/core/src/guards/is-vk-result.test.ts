import { describe, it, expect } from 'vitest';
import { isVKResult } from './is-vk-result.js';

describe('isVKResult', () => {
  it('identifies VKResult-like objects', () => {
    expect(isVKResult({ isSuccess: true, isFailure: false, errors: [] })).toBe(true);
    expect(isVKResult({ success: true })).toBe(false);
    expect(isVKResult(null)).toBe(false);
  });
});
