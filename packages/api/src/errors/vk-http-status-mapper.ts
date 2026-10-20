// [CS.01] Mapping HTTP status codes to standardized VKErrorType
import { VKErrorType } from '@vk-blocks/core';

export function mapHttpStatusToErrorType(status: number): VKErrorType {
  if (status === 400) return VKErrorType.Validation;
  if (status === 401) return VKErrorType.Unauthorized;
  if (status === 403) return VKErrorType.Forbidden;
  if (status === 404) return VKErrorType.NotFound;
  if (status === 409) return VKErrorType.Conflict;
  if (status === 412) return VKErrorType.PreconditionFailed;
  if (status === 429) return VKErrorType.TooManyRequests;
  if (status === 408 || status === 504) return VKErrorType.Timeout;
  if (status === 503) return VKErrorType.ServiceUnavailable;
  return VKErrorType.Failure;
}

/**
 * Status mapper conforming to VK naming convention (AP.03).
 */
export const vkMapHttpStatusToErrorType = mapHttpStatusToErrorType;
