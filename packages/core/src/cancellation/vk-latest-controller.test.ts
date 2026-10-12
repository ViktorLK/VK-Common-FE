import { describe, it, expect } from 'vitest';
import { vkDelay } from '../async/delay.js';
import { isAbortError } from '../guards/is-abort-error.js';
import { VKLatestController, createVKLatestController } from './vk-latest-controller.js';

describe('VKLatestController (Item 23 / CS.03)', () => {
  it('aborts prior signal when next() is called', () => {
    const controller = new VKLatestController();
    const firstSignal = controller.signal;
    expect(firstSignal.aborted).toBe(false);

    const secondSignal = controller.next();
    expect(firstSignal.aborted).toBe(true);
    expect(secondSignal.aborted).toBe(false);
  });

  it('runs latest async operation and aborts prior run invocation', async () => {
    const controller = createVKLatestController();
    const results: string[] = [];

    const task1 = controller.run(async (signal) => {
      try {
        await vkDelay(50, signal);
        results.push('task1');
      } catch (err: unknown) {
        if (isAbortError(err)) {
          results.push('task1-aborted');
        }
      }
    });

    const task2 = controller.run(async (signal) => {
      try {
        await vkDelay(20, signal);
        results.push('task2');
      } catch (err: unknown) {
        if (isAbortError(err)) {
          results.push('task2-aborted');
        }
      }
    });

    await Promise.all([task1, task2]);

    expect(results).toContain('task1-aborted');
    expect(results).toContain('task2');
  });
});
