import { describe, it, expect } from 'vitest';
import { withTimeout } from './with-timeout.js';
import { delay } from './delay.js';
import { VKError } from '../errors/vk-error.js';
import { VKCoreErrorCodes } from '../errors/errors.constants.js';

describe('withTimeout', () => {
  it('resolves if within deadline', async () => {
    const res = await withTimeout(delay(10).then(() => 'done'), 50);
    expect(res).toBe('done');
  });

  it('rejects with VKError.timeout if timeout expires', async () => {
    const errorPromise = withTimeout(delay(100), 10);
    await expect(errorPromise).rejects.toBeInstanceOf(VKError);
    await expect(errorPromise).rejects.toMatchObject({
      code: VKCoreErrorCodes.Timeout,
    });
  });

  it('rejects if signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('Manual abort'));
    await expect(withTimeout(delay(100), 50, controller.signal)).rejects.toThrow('Manual abort');
  });
});
