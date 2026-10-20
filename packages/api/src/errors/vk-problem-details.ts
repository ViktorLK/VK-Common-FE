// [CS.01] & [FS-02] Standard RFC 7807 Problem Details for HTTP APIs
import type {
  VKProblemDetails as CoreProblemDetails,
  VKFieldError,
  VKErrorCategory,
} from '@vk-blocks/core';

export type { VKFieldError, VKErrorCategory };

/**
 * Standard RFC 7807 / RFC 9457 Problem Details object representation.
 * Aligned with isomorphic wire model in @vk-blocks/core (FS-02).
 */
export interface VKProblemDetails extends Partial<CoreProblemDetails> {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly traceId?: string;
  readonly category?: VKErrorCategory;
  readonly fieldErrors?: readonly VKFieldError[];
  readonly errors?: Readonly<Record<string, readonly string[]>>;
  readonly [key: string]: unknown;
}

/**
 * Type guard to check if an arbitrary object is an RFC 7807 Problem Details structure.
 */
export function isVKProblemDetails(obj: unknown): obj is VKProblemDetails {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  const record = obj as Record<string, unknown>;
  const hasProblemType = typeof record['type'] === 'string';
  const hasTitle = typeof record['title'] === 'string';
  const hasDetail = typeof record['detail'] === 'string';
  const hasStatus = typeof record['status'] === 'number';
  const hasErrorsDict =
    typeof record['errors'] === 'object' &&
    record['errors'] !== null &&
    !Array.isArray(record['errors']);

  return (
    hasProblemType ||
    hasTitle ||
    hasDetail ||
    (hasStatus && (hasTitle || hasErrorsDict)) ||
    hasErrorsDict
  );
}

/**
 * Alias conforming to VK naming convention.
 */
export const vkIsProblemDetails = isVKProblemDetails;

/**
 * Parses a raw response record into a typed RFC 7807 ProblemDetails object.
 * Normalizes field-level errors dictionary into structured VKFieldError items.
 */
export function vkParseProblemDetails(
  record: Record<string, unknown>,
  fallbackStatus?: number,
): VKProblemDetails {
  const type = typeof record['type'] === 'string' ? record['type'] : undefined;
  const title = typeof record['title'] === 'string' ? record['title'] : undefined;
  const status = typeof record['status'] === 'number' ? record['status'] : fallbackStatus;
  const detail = typeof record['detail'] === 'string' ? record['detail'] : undefined;
  const instance = typeof record['instance'] === 'string' ? record['instance'] : undefined;
  const traceId =
    typeof record['traceId'] === 'string'
      ? record['traceId']
      : typeof record['requestId'] === 'string'
        ? (record['requestId'] as string)
        : undefined;

  let fieldErrors: VKFieldError[] | undefined;
  const rawErrors = record['errors'];

  if (rawErrors && typeof rawErrors === 'object' && !Array.isArray(rawErrors)) {
    fieldErrors = [];
    for (const [field, messages] of Object.entries(rawErrors as Record<string, unknown>)) {
      if (Array.isArray(messages)) {
        for (const msg of messages) {
          if (typeof msg === 'string') {
            fieldErrors.push({ path: field, code: `Validation.${field}`, message: msg });
          }
        }
      } else if (typeof messages === 'string') {
        fieldErrors.push({ path: field, code: `Validation.${field}`, message: messages });
      }
    }
  }

  return {
    ...record,
    type,
    title,
    status,
    detail,
    instance,
    traceId,
    fieldErrors: fieldErrors && fieldErrors.length > 0 ? fieldErrors : undefined,
    errors: rawErrors as Readonly<Record<string, readonly string[]>> | undefined,
  };
}
