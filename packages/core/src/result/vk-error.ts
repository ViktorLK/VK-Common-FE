import { VKErrorType } from './vk-error-type.js';

/**
 * Represents a standardized error with a code and description.
 */
export interface VKError {
  readonly code: string;
  readonly description: string;
  readonly type: VKErrorType;
}

export const VKError = {
  none: { code: '', description: '', type: VKErrorType.None } as VKError,
  nullValue: { code: 'VKError.NullValue', description: 'The specified result value is null.', type: VKErrorType.Failure } as VKError,
  conditionNotMet: { code: 'VKError.ConditionNotMet', description: 'The specified condition was not met.', type: VKErrorType.Failure } as VKError,

  validation: (code: string, description: string): VKError => ({ code, description, type: VKErrorType.Validation }),
  unauthorized: (code: string, description: string): VKError => ({ code, description, type: VKErrorType.Unauthorized }),
  forbidden: (code: string, description: string): VKError => ({ code, description, type: VKErrorType.Forbidden }),
  notFound: (code: string, description: string): VKError => ({ code, description, type: VKErrorType.NotFound }),
  conflict: (code: string, description: string): VKError => ({ code, description, type: VKErrorType.Conflict }),
  preconditionFailed: (code: string, description: string): VKError => ({ code, description, type: VKErrorType.PreconditionFailed }),
  tooManyRequests: (code: string, description: string): VKError => ({ code, description, type: VKErrorType.TooManyRequests }),
  failure: (code: string, description: string): VKError => ({ code, description, type: VKErrorType.Failure }),
  externalError: (code: string, description: string): VKError => ({ code, description, type: VKErrorType.ExternalError }),
  serviceUnavailable: (code: string, description: string): VKError => ({ code, description, type: VKErrorType.ServiceUnavailable }),
  timeout: (code: string, description: string): VKError => ({ code, description, type: VKErrorType.Timeout }),
} as const;
