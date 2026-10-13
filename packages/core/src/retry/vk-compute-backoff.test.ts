import { describe, it, expect } from 'vitest';
import { vkComputeBackoff } from './exponential-backoff.js';

describe('vkComputeBackoff (Item 27 / OR.03)', () => {
  it('computes backoff delay directly with attempt number and options', () => {
    const delay = vkComputeBackoff(0, { baseDelayMs: 100, jitter: false });
    expect(delay).toBe(100);

    const delayAttempt1 = vkComputeBackoff(1, { baseDelayMs: 100, jitter: false });
    expect(delayAttempt1).toBe(200);

    const delayAttempt2 = vkComputeBackoff(2, { baseDelayMs: 100, jitter: false });
    expect(delayAttempt2).toBe(400);
  });

  it('acts as a backoff factory when called with options only', () => {
    const compute = vkComputeBackoff({ baseDelayMs: 50, maxDelayMs: 150, jitter: false });
    expect(typeof compute).toBe('function');
    expect(compute(0)).toBe(50);
    expect(compute(1)).toBe(100);
    expect(compute(2)).toBe(150); // Capped at maxDelayMs
  });
});
