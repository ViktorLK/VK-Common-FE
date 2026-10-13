// [CS.03] Single-flight concurrency primitive for sharing in-flight promises
/**
 * Wraps an async function so that concurrent invocations share the same in-flight Promise.
 * Ideal for deduplicating concurrent operations such as token refresh.
 */
export function singleFlight<T>(fn: () => Promise<T>): () => Promise<T> {
  let inFlightPromise: Promise<T> | null = null;

  return async (): Promise<T> => {
    if (inFlightPromise) {
      return inFlightPromise;
    }

    inFlightPromise = fn().finally(() => {
      inFlightPromise = null;
    });

    return inFlightPromise;
  };
}

/**
 * Alias conforming to VK prefix convention (Item 19).
 */
export const vkSingleFlight = singleFlight;

