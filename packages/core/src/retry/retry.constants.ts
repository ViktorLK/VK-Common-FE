// [OR.03] Retry defaults
import type { VKRetryOptions } from './retry.types.js';

export const DEFAULT_RETRY_OPTIONS: VKRetryOptions = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 10000,
  jitter: true,
};
