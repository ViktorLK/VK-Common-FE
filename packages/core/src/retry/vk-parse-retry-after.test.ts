import { describe, it, expect } from 'vitest';
import { vkParseRetryAfter } from './vk-parse-retry-after.js';

describe('vkParseRetryAfter (Item 28 / FS-06)', () => {
  it('parses integer seconds into milliseconds', () => {
    expect(vkParseRetryAfter('120')).toBe(120000);
    expect(vkParseRetryAfter(5)).toBe(5000);
    expect(vkParseRetryAfter('0')).toBe(0);
  });

  it('parses HTTP-Date format into difference milliseconds', () => {
    const fixedNow = new Date('2026-10-07T08:00:00.000Z').getTime();
    const targetDate = 'Wed, 07 Oct 2026 08:00:30 GMT'; // 30 seconds ahead

    const parsed = vkParseRetryAfter(targetDate, {
      nowMs: () => fixedNow,
    });

    expect(parsed).toBe(30000);
  });

  it('returns defaultMs on empty or invalid inputs', () => {
    expect(vkParseRetryAfter(null, { defaultMs: 1000 })).toBe(1000);
    expect(vkParseRetryAfter(undefined, { defaultMs: 2000 })).toBe(2000);
    expect(vkParseRetryAfter('invalid-string', { defaultMs: 500 })).toBe(500);
  });

  it('respects maxMs cap', () => {
    expect(vkParseRetryAfter('300', { maxMs: 10000 })).toBe(10000);
  });
});
