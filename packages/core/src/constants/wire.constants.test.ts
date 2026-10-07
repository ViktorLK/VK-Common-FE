import { describe, it, expect } from 'vitest';
import { VKWireConstants } from './wire.constants.js';

describe('VKWireConstants (FS-01 / FS-02 / FS-06 / FS-11)', () => {
  it('exposes immutable wire headers and content types', () => {
    expect(VKWireConstants.HeaderTraceparent).toBe('traceparent');
    expect(VKWireConstants.HeaderRetryAfter).toBe('Retry-After');
    expect(VKWireConstants.ContentTypeProblemJson).toBe('application/problem+json');
    expect(VKWireConstants.ContentTypeJson).toBe('application/json');
  });
});
