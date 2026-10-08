// [CS.01] Centralized error codes and error registry
// [FS-02] Category matching across frontend and backend boundaries
export const VKErrorCategory = {
  None: 'None',
  Validation: 'Validation',
  Unauthorized: 'Unauthorized',
  Forbidden: 'Forbidden',
  NotFound: 'NotFound',
  Conflict: 'Conflict',
  PreconditionFailed: 'PreconditionFailed',
  TooManyRequests: 'TooManyRequests',
  Failure: 'Failure',
  ExternalError: 'ExternalError',
  ServiceUnavailable: 'ServiceUnavailable',
  Timeout: 'Timeout',
} as const;

export type VKErrorCategory = (typeof VKErrorCategory)[keyof typeof VKErrorCategory];

/**
 * @deprecated Use VKErrorCategory instead per FS-02.
 */
export const VKErrorType = VKErrorCategory;
/**
 * @deprecated Use VKErrorCategory instead per FS-02.
 */
export type VKErrorType = VKErrorCategory;


export const VKCoreErrorCodes = {
  NullValue: 'Core.NullValue',
  ConditionNotMet: 'Core.ConditionNotMet',
  InvalidArgument: 'Core.InvalidArgument',
  NotFound: 'Core.NotFound',
  Unauthorized: 'Core.Unauthorized',
  Forbidden: 'Core.Forbidden',
  Timeout: 'Core.Timeout',
  ServiceUnavailable: 'Core.ServiceUnavailable',
  AssertionFailed: 'Core.AssertionFailed',
  ExecutionError: 'Core.ExecutionError',
} as const;
