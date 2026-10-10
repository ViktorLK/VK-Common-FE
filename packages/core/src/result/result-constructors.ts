// [CS.01] Result Pattern Constructors and Utilities
// [FS-02] Isomorphic Error and Result handling
import { VKError } from '../errors/vk-error.js';
import { toVKError } from '../errors/to-vk-error.js';
import { VKResultErrorCodes } from './result.errors.js';
import type { VKOk, VKErr, VKResult } from './result.types.js';

/**
 * Creates a successful VKResult containing the given value.
 */
export function vkOk<T>(value: T): VKOk<T> {
  return {
    isSuccess: true,
    isFailure: false,
    value,
    errors: [],
  };
}

/**
 * Creates a failed VKResult containing the given error.
 */
export function vkErr<E = VKError>(error: E): VKErr<E> {
  return {
    isSuccess: false,
    isFailure: true,
    value: undefined,
    errors: [error],
    error,
  };
}

/**
 * Type guard checking whether a VKResult represents a success outcome.
 */
export function vkIsOk<T, E>(result: VKResult<T, E>): result is VKOk<T> {
  return result.isSuccess;
}

/**
 * Type guard checking whether a VKResult represents a failure outcome.
 */
export function vkIsErr<T, E>(result: VKResult<T, E>): result is VKErr<E> {
  return result.isFailure;
}

/**
 * Executes a Promise and maps its resolution or rejection into a VKResult.
 * Unexpected thrown exceptions are normalized to VKError via toVKError.
 */
export async function vkFromPromise<T, E = VKError>(
  promise: Promise<T>,
  mapError: (error: unknown) => E = (e) => toVKError(e) as unknown as E,
): Promise<VKResult<T, E>> {
  try {
    const data = await promise;
    return vkOk(data);
  } catch (e: unknown) {
    return vkErr(mapError(e));
  }
}

/**
 * Unwraps the value of a successful VKResult, or throws the error as a VKError.
 * Bridges Result-based services to exception-driven callers (e.g. TanStack Query, Error Boundaries).
 */
export function vkUnwrapOrThrow<T, E = VKError>(result: VKResult<T, E>): T {
  if (result.isSuccess) {
    return result.value;
  }

  const firstError = result.error ?? result.errors[0];
  throw toVKError(firstError, VKResultErrorCodes.UnwrapFailed);
}
