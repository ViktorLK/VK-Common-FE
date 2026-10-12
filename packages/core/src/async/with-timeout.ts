// [CS.03] Timeout wrapper for promises
import { VKError } from '../errors/vk-error.js';
import { VKCoreErrorCodes } from '../errors/errors.constants.js';

/**
 * Rejects if the input promise does not settle within timeoutMs milliseconds.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal | null,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        VKError.timeout(
          VKCoreErrorCodes.Timeout,
          `Operation timed out after ${timeoutMs}ms.`,
        ),
      );
    }, timeoutMs);
  });

  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        const createAbortError = () => {
          if (signal.reason instanceof Error) {
            return signal.reason;
          }
          const err = new Error(signal.reason ? String(signal.reason) : 'Operation aborted');
          err.name = 'AbortError';
          return err;
        };

        if (signal.aborted) {
          return reject(createAbortError());
        }

        onAbort = () => {
          reject(createAbortError());
        };

        signal.addEventListener('abort', onAbort, { once: true });
      })
    : null;

  try {
    const races = abortPromise
      ? [promise, timeoutPromise, abortPromise]
      : [promise, timeoutPromise];
    return await Promise.race(races);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
    if (signal && onAbort) {
      signal.removeEventListener('abort', onAbort);
    }
  }
}
