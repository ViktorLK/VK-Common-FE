import { describe, it, expect } from 'vitest';
import { createKeyedSingleFlight } from './create-keyed-single-flight.js';
import { delay } from './delay.js';

describe('createKeyedSingleFlight', () => {
  it('deduplicates per key', async () => {
    const flight = createKeyedSingleFlight();
    let callsA = 0;
    let callsB = 0;

    const [a1, a2, b1] = await Promise.all([
      flight.run('keyA', async () => {
        callsA++;
        await delay(10);
        return 'resA';
      }),
      flight.run('keyA', async () => {
        callsA++;
        await delay(10);
        return 'resA';
      }),
      flight.run('keyB', async () => {
        callsB++;
        await delay(10);
        return 'resB';
      }),
    ]);

    expect(callsA).toBe(1);
    expect(callsB).toBe(1);
    expect(a1).toBe('resA');
    expect(a2).toBe('resA');
    expect(b1).toBe('resB');
  });
});
