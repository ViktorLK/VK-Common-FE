import { describe, it, expect } from 'vitest';
import { createMutex } from './create-mutex.js';
import { delay } from './delay.js';

describe('createMutex', () => {
  it('serializes execution', async () => {
    const mutex = createMutex();
    const sequence: number[] = [];

    const p1 = mutex.run(async () => {
      await delay(20);
      sequence.push(1);
    });

    const p2 = mutex.run(async () => {
      await delay(5);
      sequence.push(2);
    });

    await Promise.all([p1, p2]);
    expect(sequence).toEqual([1, 2]);
  });
});
