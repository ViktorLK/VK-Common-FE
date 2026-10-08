// [CS.01] Normalization of arbitrary exceptions into standard VKError
import { VKError } from './vk-error.js';
import { VKErrorType, VKCoreErrorCodes } from './errors.constants.js';
import { safeJsonStringify } from '../internal/serialization/safe-json-stringify.js';

/**
 * Normalizes any unknown thrown value into a structured VKError.
 */
export function toVKError(error: unknown, fallbackCode: string = VKCoreErrorCodes.ExecutionError): VKError {
  if (error instanceof VKError) {
    return error;
  }

  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    const finalCode = typeof code === 'string' && code.length > 0 ? code : fallbackCode;
    return new VKError(finalCode, error.message, VKErrorType.Failure, {
      cause: error,
      title: error.name,
    });
  }

  if (typeof error === 'string') {
    return new VKError(fallbackCode, error, VKErrorType.Failure);
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as Record<string, unknown>;
    const code = typeof candidate['code'] === 'string' ? candidate['code'] : fallbackCode;
    const description =
      typeof candidate['description'] === 'string'
        ? candidate['description']
        : typeof candidate['message'] === 'string'
        ? (candidate['message'] as string)
        : safeJsonStringify(error);

    return new VKError(code, description, VKErrorType.Failure, {
      cause: error,
    });
  }

  return new VKError(fallbackCode, String(error), VKErrorType.Failure);
}
