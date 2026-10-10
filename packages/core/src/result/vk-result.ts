// [CS.01] Result Pattern implementation
// [FS-02] Isomorphic VKResult implementation
import { VKError } from '../errors/vk-error.js';
import { toVKError } from '../errors/to-vk-error.js';
import { VKResultErrorCodes } from './result.errors.js';
import { isStandardSchema, VKSchemaErrorCodes } from '../schema/index.js';
import type { StandardSchemaV1, VKLegacySafeParseSchema } from '../schema/index.js';
import type { VKFieldError } from '../errors/errors.types.js';
import {
  vkOk,
  vkErr,
  vkFromPromise,
  vkUnwrapOrThrow,
} from './result-constructors.js';
import type {
  VKResult as VKResultType,
  VKVoidResult,
  VKOk as VKOkType,
  VKErr as VKErrType,
  VKEither,
} from './result.types.js';

export type { VKVoidResult, VKEither };
export type VKResult<T, E = VKError> = VKResultType<T, E>;

export const VKResult = {
  /**
   * Creates a successful result with a value.
   */
  success: <T>(value: T): VKOkType<T> => vkOk(value),

  /**
   * Creates a failed result with a single error.
   */
  failure: <T = never, E = VKError>(error: E): VKErrType<E> => vkErr(error),

  /**
   * Creates a failed result with multiple errors.
   */
  failureMany: <T = never, E = VKError>(errors: readonly E[]): VKErrType<E> => {
    if (errors.length === 0) {
      throw new VKError(
        VKResultErrorCodes.EmptyFailure,
        'Failure result must contain at least one error.',
      );
    }
    const [firstError] = errors;
    return {
      isSuccess: false,
      isFailure: true,
      value: undefined,
      errors,
      error: firstError as E,
    };
  },

  /**
   * Creates a result based on a nullable value.
   * If value is non-null/undefined -> success; otherwise failure with VKError.nullValue.
   */
  create: <T>(value: T | null | undefined): VKResultType<NonNullable<T>, VKError> => {
    if (value !== null && value !== undefined) {
      return VKResult.success(value as NonNullable<T>);
    }
    return VKResult.failure(VKError.nullValue);
  },

  /**
   * Unwraps a result value. If failed, throws the first error as a VKError.
   */
  unwrap: <T, E>(result: VKResultType<T, E>): T => vkUnwrapOrThrow(result),

  /**
   * Unwraps a result value, returning a fallback if failed.
   */
  unwrapOr: <T, E>(result: VKResultType<T, E>, fallback: T): T => {

    if (result.isSuccess) {
      return result.value;
    }
    return fallback;
  },

  /**
   * Pattern matches on success or failure.
   */
  match: <T, E, U>(
    result: VKResultType<T, E>,
    onSuccess: (value: T) => U,
    onFailure: (errors: readonly E[]) => U,
  ): U => {
    if (result.isSuccess) {
      return onSuccess(result.value);
    }
    return onFailure(result.errors);
  },

  /**
   * Maps the success value to a new value.
   */
  map: <T, E, U>(result: VKResultType<T, E>, fn: (value: T) => U): VKResultType<U, E> => {
    if (result.isSuccess) {
      return VKResult.success(fn(result.value));
    }
    return VKResult.failureMany(result.errors);
  },

  /**
   * Maps all errors to new errors.
   */
  mapError: <T, E, F>(result: VKResultType<T, E>, fn: (err: E) => F): VKResultType<T, F> => {
    if (result.isSuccess) {
      return result;
    }
    return VKResult.failureMany(result.errors.map(fn));
  },

  /**
   * Chains a function returning a VKResult.
   */
  bind: <T, E, U>(
    result: VKResultType<T, E>,
    fn: (value: T) => VKResultType<U, E>,
  ): VKResultType<U, E> => {
    if (result.isSuccess) {
      return fn(result.value);
    }
    return VKResult.failureMany(result.errors);
  },

  /**
   * Catamorphism/Fold: handles failure or success, returning a single merged value.
   */
  fold: <T, E, U>(
    result: VKResultType<T, E>,
    onFailure: (errors: readonly E[]) => U,
    onSuccess: (value: T) => U,
  ): U => {
    if (result.isSuccess) {
      return onSuccess(result.value);
    }
    return onFailure(result.errors);
  },

  /**
   * Maps both failure and success sides simultaneously (bifunctor).
   */
  bimap: <T, E, U, F>(
    result: VKResultType<T, E>,
    onSuccess: (value: T) => U,
    onError: (error: E) => F,
  ): VKResultType<U, F> => {
    if (result.isSuccess) {
      return VKResult.success(onSuccess(result.value));
    }
    return VKResult.failureMany(result.errors.map(onError));
  },

  /**
   * Validates an input against a StandardSchemaV1 or legacy safeParse schema, returning a typed VKResult.
   * If validation fails, wraps errors into a RFC 7807 ProblemDetails-compatible VKError with structured fieldErrors.
   */
  fromSchema: <TOutput, TInput = unknown>(
    schema: StandardSchemaV1<TInput, TOutput> | VKLegacySafeParseSchema<TOutput>,
    input: TInput,
  ): Promise<VKResultType<TOutput, VKError>> | VKResultType<TOutput, VKError> => {
    if (isStandardSchema(schema)) {
      const outcome = schema['~standard'].validate(input);
      if (outcome instanceof Promise) {
        return outcome.then((res): VKResultType<TOutput, VKError> => {
          if (res.issues) {
            const fieldErrors: VKFieldError[] = res.issues.map((issue) => ({
              path: issue.path
                ? issue.path
                    .map((p) => (typeof p === 'object' && p !== null && 'key' in p ? String(p.key) : String(p)))
                    .join('.')
                : '',
              code: VKSchemaErrorCodes.ValidationFailed,
              message: issue.message,
            }));
            return VKResult.failure(
              VKError.validation(
                VKSchemaErrorCodes.ValidationFailed,
                'Schema validation failed.',
                { fieldErrors, extensions: { issues: res.issues } },
              ),
            );
          }
          return VKResult.success(res.value);
        });
      }

      if (outcome.issues) {
        const fieldErrors: VKFieldError[] = outcome.issues.map((issue) => ({
          path: issue.path
            ? issue.path
                .map((p) => (typeof p === 'object' && p !== null && 'key' in p ? String(p.key) : String(p)))
                .join('.')
            : '',
          code: VKSchemaErrorCodes.ValidationFailed,
          message: issue.message,
        }));
        return VKResult.failure(
          VKError.validation(
            VKSchemaErrorCodes.ValidationFailed,
            'Schema validation failed.',
            { fieldErrors, extensions: { issues: outcome.issues } },
          ),
        );
      }
      return VKResult.success(outcome.value);
    }

    if (typeof (schema as { safeParse?: unknown }).safeParse === 'function') {
      const legacyParsed = (schema as VKLegacySafeParseSchema<TOutput>).safeParse(input);
      if (legacyParsed.success) {
        return VKResult.success(legacyParsed.data);
      }
      const fieldErrors: VKFieldError[] = [];
      if (legacyParsed.error.flatten) {
        const flattened = legacyParsed.error.flatten();
        for (const [field, msgs] of Object.entries(flattened.fieldErrors)) {
          const list = Array.isArray(msgs) ? msgs : [String(msgs)];
          for (const msg of list) {
            fieldErrors.push({
              path: field,
              code: VKSchemaErrorCodes.ValidationFailed,
              message: String(msg),
            });
          }
        }
      }
      if (fieldErrors.length === 0) {
        fieldErrors.push({
          path: '',
          code: VKSchemaErrorCodes.ValidationFailed,
          message: legacyParsed.error.message ?? 'Schema validation failed.',
        });
      }
      return VKResult.failure(
        VKError.validation(
          VKSchemaErrorCodes.ValidationFailed,
          'Schema validation failed.',
          { fieldErrors },
        ),
      );
    }

    return VKResult.failure(
      VKError.validation(VKSchemaErrorCodes.InvalidSchema, 'Invalid schema instance provided.'),
    );
  },

  /**
   * Executes an asynchronous promise and wraps its outcome in VKResult.
   */
  fromPromise: <T, E = VKError>(
    promise: Promise<T>,
    mapError?: (error: unknown) => E,
  ): Promise<VKResultType<T, E>> => vkFromPromise(promise, mapError),


  /**
   * Deserializes wire payloads (e.g. HTTP response body, RFC 7807 problem details) into VKResult.
   */
  fromWire: <T>(
    payload: unknown,
    parser?: (value: unknown) => VKResultType<T, VKError>,
  ): VKResultType<T, VKError> => {
    if (payload === null || payload === undefined) {
      return VKResult.failure(VKError.nullValue);
    }

    if (typeof payload === 'object') {
      const obj = payload as Record<string, unknown>;

      // Explicit VKResult wire representation
      if (typeof obj['isSuccess'] === 'boolean') {
        if (obj['isSuccess']) {
          const val = obj['value'];
          return parser ? parser(val) : VKResult.success(val as T);
        }
        const wireErrors = Array.isArray(obj['errors']) ? obj['errors'] : [];
        const normalized =
          wireErrors.length > 0
            ? wireErrors.map((e) => toVKError(e))
            : [VKError.failure(VKResultErrorCodes.WireUnknown, 'Unknown wire failure')];
        return VKResult.failureMany(normalized);
      }

      // RFC 7807 ProblemDetails representation
      if (typeof obj['status'] === 'number' && obj['status'] >= 400) {
        const code =
          typeof obj['code'] === 'string' ? obj['code'] : VKResultErrorCodes.WireUnknown;
        const detail =
          typeof obj['detail'] === 'string'
            ? obj['detail']
            : typeof obj['title'] === 'string'
            ? obj['title']
            : 'Remote service error';
        return VKResult.failure(
          new VKError(code, detail, undefined, {
            status: obj['status'],
            title: typeof obj['title'] === 'string' ? obj['title'] : undefined,
            type: typeof obj['type'] === 'string' ? obj['type'] : undefined,
            instance: typeof obj['instance'] === 'string' ? obj['instance'] : undefined,
            extensions: obj,
          }),
        );
      }
    }

    return parser ? parser(payload) : VKResult.success(payload as T);
  },

  /**
   * Void result helpers.
   */
  void: {
    success: (): VKVoidResult<never> => ({
      isSuccess: true,
      isFailure: false,
      errors: [],
    }),

    failure: <E = VKError>(error: E): VKVoidResult<E> => ({
      isSuccess: false,
      isFailure: true,
      errors: [error],
      error,
    }),

    failureMany: <E = VKError>(errors: readonly E[]): VKVoidResult<E> => {
      if (errors.length === 0) {
        throw new VKError(
          VKResultErrorCodes.EmptyFailure,
          'Failure result must contain at least one error.',
        );
      }
      const [firstError] = errors;
      return {
        isSuccess: false,
        isFailure: true,
        errors,
        error: firstError as E,
      };
    },
  },
} as const;
