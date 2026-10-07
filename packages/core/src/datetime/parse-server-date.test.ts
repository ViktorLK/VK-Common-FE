import { describe, it, expect } from 'vitest';
import { parseServerDate, tryParseServerDate } from './index.js';
import { VKDatetimeErrorCodes } from './datetime.errors.js';
import { VKError } from '../errors/vk-error.js';

describe('parse-server-date', () => {
  it('parses valid ISO 8601 UTC date strings', () => {
    const d = parseServerDate('2026-10-04T12:00:00.000Z');
    expect(d).toBeInstanceOf(Date);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(9); // 0-indexed October
    expect(d.getUTCDate()).toBe(4);
    expect(d.getUTCHours()).toBe(12);
  });

  it('parses valid ISO 8601 strings with explicit timezone offsets', () => {
    const d = parseServerDate('2026-10-04T21:00:00+09:00');
    expect(d).toBeInstanceOf(Date);
    expect(d.getUTCHours()).toBe(12); // 21:00 in +09:00 is 12:00 UTC
  });

  it('parses date-only ISO strings', () => {
    const d = parseServerDate('2026-10-04');
    expect(d).toBeInstanceOf(Date);
    expect(d.getUTCFullYear()).toBe(2026);
  });

  it('rejects datetime strings without explicit offset per FS-05', () => {
    const result = tryParseServerDate('2026-10-04T12:00:00');
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.errors[0]?.code).toBe(VKDatetimeErrorCodes.InvalidFormat);
    }

    expect(() => parseServerDate('2026-10-04T12:00:00')).toThrowError(VKError);
  });

  it('rejects invalid or non-date strings', () => {
    expect(() => parseServerDate('invalid-date')).toThrowError(VKError);
    expect(() => parseServerDate('')).toThrowError(VKError);

    const res = tryParseServerDate(null);
    expect(res.isFailure).toBe(true);
  });
});
