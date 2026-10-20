// [OR.01] Structured telemetry metrics for HTTP client operations

/**
 * Structured metric data emitted upon HTTP request completion.
 */
export interface VKHttpMetric {
  readonly method: string;
  readonly url: string;
  readonly status: number;
  readonly durationMs: number;
  readonly traceId: string;
  readonly attemptCount: number;
  readonly isSuccess: boolean;
}
