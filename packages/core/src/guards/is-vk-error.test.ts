import { describe, it, expect } from 'vitest';
import { isVKError } from './is-vk-error.js';

describe('isVKError', () => {
  it('identifies VKError-like objects', () => {
    expect(isVKError({ code: 'Auth.Failed', description: 'Failed' })).toBe(true);
    expect(isVKError({ message: 'Error' })).toBe(false);
    expect(isVKError(null)).toBe(false);
  });
});
