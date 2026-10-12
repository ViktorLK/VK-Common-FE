// [CS.03] In-page mutex concurrency primitive
import type { VKMutex } from './async.types.js';

/**
 * Creates an in-page mutual exclusion lock for serializing asynchronous tasks.
 */
export function createMutex(): VKMutex {
  let currentPromise: Promise<unknown> = Promise.resolve();

  return {
    run: async <T>(fn: () => Promise<T>): Promise<T> => {
      const nextPromise = currentPromise.then(() => fn());
      currentPromise = nextPromise.catch(() => {});
      return nextPromise;
    },
  };
}

/**
 * Aliases conforming to VK prefix convention (Item 20).
 */
export const createVKAsyncLock = createMutex;
export const vkCreateAsyncLock = createMutex;
export const createVKMutex = createMutex;

