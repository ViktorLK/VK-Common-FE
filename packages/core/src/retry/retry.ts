// [OR.03] Core retry executor
import { delay } from '../async/delay.js';
import { exponentialBackoff } from './exponential-backoff.js';
import { throwIfAborted } from '../cancellation/throw-if-aborted.js';
import type { VKRetryPolicy } from './retry.types.js';

/**
 * Retries an asynchronous function with backoff and cancellation.
 */
export async function retry<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  policy?: VKRetryPolicy,
  signal?: AbortSignal,
): Promise<T> {
  const maxRetries = policy?.maxRetries ?? 3;
  const backoff = policy?.backoff ?? exponentialBackoff();
  let attempt = 0;

  while (true) {
    throwIfAborted(signal);

    try {
      return await fn(signal);
    } catch (error) {
      attempt++;
      if (attempt > maxRetries) {
        throw error;
      }

      if (policy?.shouldRetry && !policy.shouldRetry(error, attempt)) {
        throw error;
      }

      const delayMs = backoff(attempt - 1);
      await delay(delayMs, signal);
    }
  }
}
