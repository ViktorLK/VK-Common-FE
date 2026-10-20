// [AP.01] Immutable HTTP constants
// [FS-11] Standard observability headers
// [FS-06] Cancellation & Idempotency headers

/**
 * Standard HTTP header names across VK.Blocks ecosystem.
 */
export const VKHttpHeaders = {
  CorrelationId: 'x-correlation-id',
  TraceParent: 'traceparent',
  TraceState: 'tracestate',
  TenantId: 'x-tenant-id',
  RequestId: 'x-request-id',
  IdempotencyKey: 'idempotency-key',
} as const;

/**
 * Standard MIME types.
 */
export const VKMimeTypes = {
  ApplicationJson: 'application/json',
  ProblemJson: 'application/problem+json',
} as const;
