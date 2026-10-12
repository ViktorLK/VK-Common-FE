// [OR.03] Retry policy types

export interface VKBackoffOptions {
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly factor?: number;
  readonly jitter?: boolean;
  readonly random?: () => number;
}

export interface VKRetryOptions {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly jitter: boolean;
  readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface VKRetryPolicy {
  readonly maxRetries: number;
  readonly backoff: (attempt: number) => number;
  readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
  readonly execute: <T>(
    fn: (signal?: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
  ) => Promise<T>;
}
