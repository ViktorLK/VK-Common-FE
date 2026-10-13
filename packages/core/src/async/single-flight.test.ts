import { describe, it, expect } from 'vitest';
import { singleFlight } from './single-flight.js';
import { delay } from './delay.js';

describe('singleFlight', () => {
  it('shares in-flight promise across concurrent callers', async () => {
    let callCount = 0;
    const worker = singleFlight(async () => {
      callCount++;
      await delay(20);
      return `data-${callCount}`;
    });

    const [r1, r2, r3] = await Promise.all([worker(), worker(), worker()]);
    expect(callCount).toBe(1);
    expect(r1).toBe('data-1');
    expect(r2).toBe('data-1');
    expect(r3).toBe('data-1');

    // After resolution, new invocation calls again
    const r4 = await worker();
    expect(callCount).toBe(2);
    expect(r4).toBe('data-2');
  });
});
