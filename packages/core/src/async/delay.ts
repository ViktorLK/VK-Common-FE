// [CS.03] Async delay with AbortSignal cancellation
/**
 * Resolves after a specified delay in milliseconds, supporting cancellation via AbortSignal.
 */
export async function delay(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    const createAbortError = (reason?: unknown) => {
      if (reason instanceof Error) {
        return reason;
      }
      const err = new Error(reason ? String(reason) : 'Delay aborted');
      err.name = 'AbortError';
      return err;
    };

    if (signal?.aborted) {
      return reject(createAbortError(signal.reason));
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const onAbort = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      reject(createAbortError(signal?.reason));
    };

    timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Alias conforming to VK prefix convention (Item 18).
 */
export const vkDelay = delay;

