import { describe, it, expect, vi } from 'vitest';
import { retry } from './retry.js';

describe('retry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const res = await retry(fn);
    expect(res).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('transient');
      }
      return 'recovered';
    });

    const res = await retry(fn, {
      maxRetries: 3,
      backoff: () => 5,
    });
    expect(res).toBe('recovered');
    expect(attempts).toBe(3);
  });

  it('throws when maxRetries exceeded', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fatal'));
    await expect(
      retry(fn, { maxRetries: 2, backoff: () => 5 }),
    ).rejects.toThrow('fatal');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('aborts early when signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('Aborted'));
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(retry(fn, { maxRetries: 3 }, controller.signal)).rejects.toThrow('Aborted');
    expect(fn).not.toHaveBeenCalled();
  });
});
