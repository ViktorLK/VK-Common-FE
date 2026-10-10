// [CS.01] Result & Error Pattern
// [FS-02] Isomorphic Error Model (RFC 7807 ProblemDetails)
import type { VKErrorCategory, VKErrorType } from './errors.constants.js';

export type { VKErrorCategory, VKErrorType };

/**
 * Standard RFC 7807 Problem Details representation.
 */
export interface VKProblemDetails {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly extensions?: Readonly<Record<string, unknown>>;
}

/**
 * Structured field-level error representation for form validation mapping.
 */
export interface VKFieldError {
  readonly path: string;
  readonly code: string;
  readonly message: string;
}

export type VKErrorSeverity = 'fatal' | 'error' | 'warn' | 'info';

/**
 * Construction options for VKError.
 */
export interface VKErrorOptions {
  readonly category?: VKErrorCategory;
  readonly severity?: VKErrorSeverity;
  readonly status?: number;
  readonly type?: string;
  readonly title?: string;
  readonly detail?: string;
  readonly instance?: string;
  readonly extensions?: Readonly<Record<string, unknown>>;
  readonly cause?: unknown;
  readonly traceId?: string;
  readonly fieldErrors?: readonly VKFieldError[];
}

