import { describe, it, expect } from 'vitest';
import { delay } from './delay.js';

describe('delay', () => {
  it('resolves after timeout', async () => {
    const start = Date.now();
    await delay(20);
    expect(Date.now() - start).toBeGreaterThanOrEqual(15);
  });

  it('rejects on AbortSignal', async () => {
    const c = new AbortController();
    c.abort(new Error('Cancelled by user'));
    await expect(delay(100, c.signal)).rejects.toThrow('Cancelled by user');
  });
});
