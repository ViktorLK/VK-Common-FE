export interface VKRetryOptions {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly jitter: boolean;
  readonly retryableStatuses?: readonly number[];
  readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface VKRetryPolicy {
  readonly execute: <T>(
    fn: (signal?: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
  ) => Promise<T>;
}

export const defaultRetryOptions: VKRetryOptions = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 10000,
  jitter: true,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

export function createVKRetryPolicy(options?: Partial<VKRetryOptions>): VKRetryPolicy {
  const config = { ...defaultRetryOptions, ...options };

  const sleep = (ms: number, signal?: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new Error(signal.reason || 'Cancelled during delay.'));
      }
      
      const onAbort = () => {
        clearTimeout(timeoutId);
        reject(new Error(signal?.reason || 'Cancelled during delay.'));
      };

      const timeoutId = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, ms);

      signal?.addEventListener('abort', onAbort);
    });
  };

  const calculateDelay = (attempt: number): number => {
    const delay = config.baseDelayMs * Math.pow(2, attempt);
    const boundedDelay = Math.min(delay, config.maxDelayMs);
    if (config.jitter) {
      return Math.random() * boundedDelay;
    }
    return boundedDelay;
  };

  return {
    execute: async <T>(
      fn: (signal?: AbortSignal) => Promise<T>,
      signal?: AbortSignal,
    ): Promise<T> => {
      let attempt = 0;
      while (true) {
        if (signal?.aborted) {
          throw new Error(signal.reason || 'Operation cancelled.');
        }

        try {
          return await fn(signal);
        } catch (error) {
          attempt++;
          if (attempt > config.maxRetries) {
            throw error;
          }

          let isRetryable = true;
          if (config.shouldRetry) {
            isRetryable = config.shouldRetry(error, attempt);
          } else if (config.retryableStatuses && typeof error === 'object' && error !== null) {
            const status =
              (error as { status?: number; statusCode?: number }).status ??
              (error as { statusCode?: number }).statusCode;
            if (typeof status === 'number') {
              isRetryable = config.retryableStatuses.includes(status);
            }
          }

          if (!isRetryable) {
            throw error;
          }

          const delayMs = calculateDelay(attempt - 1);
          await sleep(delayMs, signal);
        }
      }
    },
  };
}
