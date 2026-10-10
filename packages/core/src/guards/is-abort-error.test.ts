import { describe, it, expect } from 'vitest';
import { isAbortError } from './is-abort-error.js';

describe('isAbortError', () => {
  it('identifies AbortError by name', () => {
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';
    expect(isAbortError(abortErr)).toBe(true);

    // Business or other errors with 'abort' or 'cancel' in message are not AbortError
    expect(isAbortError(new Error('Operation cancelled by user'))).toBe(false);
    expect(isAbortError(new Error('Network error'))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});
