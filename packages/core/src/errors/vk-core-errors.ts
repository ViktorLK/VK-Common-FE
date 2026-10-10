// [CS.01] Predefined sentinel error instances
import { VKCoreErrorCodes } from './errors.constants.js';
import { VKError } from './vk-error.js';

export const VKCoreErrors = {
  NullValue: VKError.failure(VKCoreErrorCodes.NullValue, 'The specified value is null or undefined.'),
  ConditionNotMet: VKError.failure(VKCoreErrorCodes.ConditionNotMet, 'The specified condition was not met.'),
  InvalidArgument: VKError.validation(VKCoreErrorCodes.InvalidArgument, 'The specified argument is invalid.'),
  NotFound: VKError.notFound(VKCoreErrorCodes.NotFound, 'The requested resource was not found.'),
  Unauthorized: VKError.unauthorized(VKCoreErrorCodes.Unauthorized, 'Authentication is required.'),
  Forbidden: VKError.forbidden(VKCoreErrorCodes.Forbidden, 'You do not have permission to perform this action.'),
  Timeout: VKError.timeout(VKCoreErrorCodes.Timeout, 'The operation timed out.'),
  ServiceUnavailable: VKError.serviceUnavailable(VKCoreErrorCodes.ServiceUnavailable, 'The service is temporarily unavailable.'),
  AssertionFailed: VKError.failure(VKCoreErrorCodes.AssertionFailed, 'An assertion invariant was violated.'),
} as const;
