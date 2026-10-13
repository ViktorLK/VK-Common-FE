// [CS.03] AbortSignal check
/**
 * Throws an error if the provided signal is aborted.
 */
export function throwIfAborted(signal?: AbortSignal | null): void {
  if (!signal) {
    return;
  }
  if (typeof signal.throwIfAborted === 'function') {
    signal.throwIfAborted();
    return;
  }
  if (signal.aborted) {
    if (signal.reason instanceof Error) {
      throw signal.reason;
    }
    const err = new Error(signal.reason ? String(signal.reason) : 'The operation was aborted');
    err.name = 'AbortError';
    throw err;
  }
}

/**
 * Alias conforming to VK prefix convention (Item 24).
 */
export const vkThrowIfAborted = throwIfAborted;

