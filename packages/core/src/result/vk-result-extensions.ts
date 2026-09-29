import { VKError } from './vk-error.js';
import { VKResult } from './vk-result.js';

/**
 * Maps the value of a successful result to a new value.
 */
export function map<T, U>(result: VKResult<T>, fn: (value: T) => U): VKResult<U> {
  if (result.isSuccess) {
    return VKResult.success(fn(result.value));
  }
  return VKResult.failureMany(result.errors);
}

/**
 * Binds the value of a successful result to a new result.
 */
export function bind<T, U>(result: VKResult<T>, fn: (value: T) => VKResult<U>): VKResult<U> {
  if (result.isSuccess) {
    return fn(result.value);
  }
  return VKResult.failureMany(result.errors);
}

/**
 * Executes an action if the result is successful, returning the original result.
 */
export function tap<T>(result: VKResult<T>, fn: (value: T) => void): VKResult<T> {
  if (result.isSuccess) {
    fn(result.value);
  }
  return result;
}

/**
 * Matches the result to a new value based on success or failure.
 */
export function match<T, U>(result: VKResult<T>, onSuccess: (value: T) => U, onFailure: (errors: readonly VKError[]) => U): U {
  if (result.isSuccess) {
    return onSuccess(result.value);
  }
  return onFailure(result.errors);
}

/**
 * Ensures the value meets a condition; otherwise, returns the specified error.
 */
export function ensure<T>(result: VKResult<T>, predicate: (value: T) => boolean, error: VKError): VKResult<T> {
  if (result.isFailure) {
    return result;
  }
  if (predicate(result.value)) {
    return result;
  }
  return VKResult.failure(error);
}

/**
 * Maps the first error of a failed result to a new error.
 */
export function mapError<T>(result: VKResult<T>, fn: (error: VKError) => VKError): VKResult<T> {
  if (result.isSuccess) {
    return result;
  }
  const [firstError, ...rest] = result.errors;
  return VKResult.failureMany([fn(firstError), ...rest]);
}

// Async variants

export async function mapAsync<T, U>(result: VKResult<T>, fn: (value: T) => Promise<U>): Promise<VKResult<U>> {
  if (result.isSuccess) {
    return VKResult.success(await fn(result.value));
  }
  return VKResult.failureMany(result.errors);
}

export async function bindAsync<T, U>(result: VKResult<T>, fn: (value: T) => Promise<VKResult<U>>): Promise<VKResult<U>> {
  if (result.isSuccess) {
    return await fn(result.value);
  }
  return VKResult.failureMany(result.errors);
}

export async function tapAsync<T>(result: VKResult<T>, fn: (value: T) => Promise<void>): Promise<VKResult<T>> {
  if (result.isSuccess) {
    await fn(result.value);
  }
  return result;
}

/**
 * Executes a synchronous function and wraps the return value in a VKResult.
 * If the function throws, catches the exception and maps it to a failure VKResult.
 */
export function tryCatch<T>(
  fn: () => T,
  mapError: (error: unknown) => VKError = (e) =>
    VKError.failure('ExecutionError', e instanceof Error ? e.message : String(e)),
): VKResult<T> {
  try {
    return VKResult.success(fn());
  } catch (e: unknown) {
    return VKResult.failure(mapError(e));
  }
}

/**
 * Executes an asynchronous function and wraps the resolved value in a VKResult.
 * If the promise rejects or throws, catches the exception and maps it to a failure VKResult.
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>,
  mapError: (error: unknown) => VKError = (e) =>
    VKError.failure('ExecutionError', e instanceof Error ? e.message : String(e)),
): Promise<VKResult<T>> {
  try {
    return VKResult.success(await fn());
  } catch (e: unknown) {
    return VKResult.failure(mapError(e));
  }
}
