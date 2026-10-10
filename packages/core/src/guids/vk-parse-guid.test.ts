import { describe, it, expect } from 'vitest';
import { vkParseGuid } from './vk-parse-guid.js';
import { VKGuidErrorCodes } from './guids.errors.js';
import type { VKTenantId } from '../types/types.types.js';

describe('vkParseGuid (FS-04 / CS.01)', () => {
  it('parses valid GUID string and returns branded ID', () => {
    const raw = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const result = vkParseGuid<VKTenantId>(raw);

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toBe(raw);
    }
  });

  it('fails and returns typed VKError on non-guid strings', () => {
    const invalid = 'not-a-guid';
    const result = vkParseGuid(invalid);

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(VKGuidErrorCodes.InvalidFormat);
    }
  });

  it('fails and returns typed VKError on non-string inputs', () => {
    expect(vkParseGuid(null).isFailure).toBe(true);
    expect(vkParseGuid(undefined).isFailure).toBe(true);
    expect(vkParseGuid(12345).isFailure).toBe(true);
  });
});
