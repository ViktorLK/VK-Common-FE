import { describe, it, expect } from 'vitest';
import { exponentialBackoff } from './exponential-backoff.js';

describe('exponentialBackoff', () => {
  it('calculates increasing delay with jitter: false', () => {
    const calc = exponentialBackoff({ baseDelayMs: 100, factor: 2, jitter: false, maxDelayMs: 1000 });
    expect(calc(0)).toBe(100);
    expect(calc(1)).toBe(200);
    expect(calc(2)).toBe(400);
    expect(calc(5)).toBe(1000); // capped at maxDelayMs
  });

  it('supports deterministic random function for testing', () => {
    const mockRandom = () => 0.5;
    const calc = exponentialBackoff({ baseDelayMs: 100, factor: 2, jitter: true, random: mockRandom });
    expect(calc(0)).toBe(50); // 100 * 0.5
    expect(calc(1)).toBe(100); // 200 * 0.5
  });
});
