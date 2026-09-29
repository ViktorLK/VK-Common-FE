import { VKError } from '../result/vk-error.js';

/**
 * Centralized error constants for the Core block.
 * Mirrors the backend's VKCoreErrors.
 */
export const VKCoreErrors = {
  NullValue: VKError.failure('Core.NullValue', 'The specified value is null or undefined.'),
  ConditionNotMet: VKError.failure('Core.ConditionNotMet', 'The specified condition was not met.'),
  InvalidArgument: VKError.validation('Core.InvalidArgument', 'The specified argument is invalid.'),
  NotFound: VKError.notFound('Core.NotFound', 'The requested resource was not found.'),
  Unauthorized: VKError.unauthorized('Core.Unauthorized', 'Authentication is required.'),
  Forbidden: VKError.forbidden('Core.Forbidden', 'You do not have permission to perform this action.'),
  Timeout: VKError.timeout('Core.Timeout', 'The operation timed out.'),
  ServiceUnavailable: VKError.serviceUnavailable('Core.ServiceUnavailable', 'The service is temporarily unavailable.'),
} as const;
