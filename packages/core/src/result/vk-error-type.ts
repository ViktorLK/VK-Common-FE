/**
 * Defines the types of errors that can occur.
 * Mirrors the backend's VKErrorType enum.
 */
export const VKErrorType = {
  None: -1,
  Failure: 0,
  Validation: 1,
  NotFound: 2,
  Conflict: 3,
  Unauthorized: 4,
  Forbidden: 5,
  TooManyRequests: 6,
  ServiceUnavailable: 7,
  Timeout: 8,
  ExternalError: 9,
  PreconditionFailed: 10,
} as const;

export type VKErrorType = (typeof VKErrorType)[keyof typeof VKErrorType];
