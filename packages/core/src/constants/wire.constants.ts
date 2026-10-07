// [FS-01] [FS-02] [FS-06] [FS-11] Shared Wire Protocol Constants
/**
 * Cross-package wire constants for HTTP headers, content types, and protocol parameters.
 */
export const VKWireConstants = {
  HeaderTraceparent: 'traceparent',
  HeaderTracestate: 'tracestate',
  HeaderRetryAfter: 'Retry-After',
  HeaderContentType: 'Content-Type',
  HeaderAuthorization: 'Authorization',
  HeaderCorrelationId: 'X-Correlation-ID',
  HeaderTenantId: 'X-Tenant-ID',
  ContentTypeJson: 'application/json',
  ContentTypeProblemJson: 'application/problem+json',
} as const;

export type VKWireConstants = typeof VKWireConstants;
