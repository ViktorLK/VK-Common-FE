// [CS.03] Keyed single-flight concurrency primitive
import type { VKKeyedSingleFlight } from './async.types.js';

/**
 * Creates a keyed single-flight manager, deduplicating concurrent executions by key.
 */
export function createKeyedSingleFlight(): VKKeyedSingleFlight {
  const inFlight = new Map<string, Promise<unknown>>();

  return {
    run: async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
      const existing = inFlight.get(key);
      if (existing) {
        return existing as Promise<T>;
      }

      const promise = fn().finally(() => {
        inFlight.delete(key);
      });

      inFlight.set(key, promise);
      return promise;
    },
  };
}

/**
 * Aliases conforming to VK prefix convention (Item 19).
 */
export const vkCreateKeyedSingleFlight = createKeyedSingleFlight;
export const createVKKeyedSingleFlight = createKeyedSingleFlight;

