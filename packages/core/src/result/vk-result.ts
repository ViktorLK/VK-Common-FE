import { VKError } from './vk-error.js';

/**
 * Represents the result of an operation, indicating success or failure.
 * This is the frontend equivalent of the backend's VKResult<T>.
 */
export type VKResult<T> =
  | { readonly isSuccess: true; readonly isFailure: false; readonly value: T; readonly errors: readonly [] }
  | { readonly isSuccess: false; readonly isFailure: true; readonly value: undefined; readonly errors: readonly VKError[] };

/**
 * Represents the result of a void operation, indicating success or failure.
 */
export type VKVoidResult =
  | { readonly isSuccess: true; readonly isFailure: false; readonly errors: readonly [] }
  | { readonly isSuccess: false; readonly isFailure: true; readonly errors: readonly VKError[] };

export const VKResult = {
  /** Creates a successful result with a value. */
  success: <T>(value: T): VKResult<T> => ({
    isSuccess: true,
    isFailure: false,
    value,
    errors: [],
  }),

  /** Creates a failed result with a specific error. */
  failure: <T>(error: VKError): VKResult<T> => ({
    isSuccess: false,
    isFailure: true,
    value: undefined,
    errors: [error],
  }),

  /** Creates a failed result with multiple errors. */
  failureMany: <T>(errors: readonly VKError[]): VKResult<T> => {
    if (errors.length === 0) {
      throw new Error("Failure result must contain at least one error.");
    }
    return {
      isSuccess: false,
      isFailure: true,
      value: undefined,
      errors,
    };
  },

  /**
   * Creates a result based on a value.
   * By design, this enforces strict null-safety: if the value is not null, it returns a successful result;
   * if the value is null, it intentionally returns a failure result with VKError.NullValue.
   */
  create: <T>(value: T | null | undefined): VKResult<NonNullable<T>> => {
    if (value !== null && value !== undefined) {
      return VKResult.success(value as NonNullable<T>);
    }
    return VKResult.failure(VKError.nullValue);
  },

  /** Creates void results. */
  void: {
    /** Creates a successful void result. */
    success: (): VKVoidResult => ({
      isSuccess: true,
      isFailure: false,
      errors: [],
    }),
    
    /** Creates a failed void result with a specific error. */
    failure: (error: VKError): VKVoidResult => ({
      isSuccess: false,
      isFailure: true,
      errors: [error],
    }),

    /** Creates a failed void result with multiple errors. */
    failureMany: (errors: readonly VKError[]): VKVoidResult => {
      if (errors.length === 0) {
        throw new Error("Failure result must contain at least one error.");
      }
      return {
        isSuccess: false,
        isFailure: true,
        errors,
      };
    }
  }
} as const;
