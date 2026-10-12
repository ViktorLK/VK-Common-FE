// [OR.03] VKRetryPolicy factory
import { retry } from './retry.js';
import { exponentialBackoff } from './exponential-backoff.js';
import { DEFAULT_RETRY_OPTIONS } from './retry.constants.js';
import type { VKRetryOptions, VKRetryPolicy } from './retry.types.js';

export function createVKRetryPolicy(options?: Partial<VKRetryOptions>): VKRetryPolicy {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const backoff = exponentialBackoff({
    baseDelayMs: config.baseDelayMs,
    maxDelayMs: config.maxDelayMs,
    jitter: config.jitter,
  });

  const policy: VKRetryPolicy = {
    maxRetries: config.maxRetries,
    backoff,
    shouldRetry: config.shouldRetry,
    execute: async <T>(
      fn: (signal?: AbortSignal) => Promise<T>,
      signal?: AbortSignal,
    ): Promise<T> => {
      return retry(fn, policy, signal);
    },
  };

  return policy;
}
