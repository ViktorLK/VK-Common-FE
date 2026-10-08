// [ARCH-13] Centralized Options Resolution
import { VKError } from '../errors/vk-error.js';
import { safeJsonStringify } from '../internal/serialization/safe-json-stringify.js';
import { isStandardSchema } from '../schema/index.js';
import { VKOptionsErrorCodes } from './options.errors.js';
import type { VKStandardSchema, VKOptionsValidator } from './options.types.js';

function isOptionsValidator<T>(
  target: VKStandardSchema<T> | VKOptionsValidator<T>,
): target is VKOptionsValidator<T> {
  return typeof (target as { validate?: unknown }).validate === 'function' && !('~standard' in (target as object));
}

function formatValidationFailure(details: unknown): string {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return 'Invalid options provided.';
  }
  return `Options validation failed: ${safeJsonStringify(details)}`;
}

/**
 * Validates and merges user options with defaults against a schema or validator port.
 */
export function resolveOptions<T>(
  schemaOrValidator: VKStandardSchema<T> | VKOptionsValidator<T>,
  defaults: Partial<T>,
  input?: Partial<T> | null,
): T {
  const merged = { ...defaults, ...(input ?? {}) };

  if (isOptionsValidator(schemaOrValidator)) {
    const result = schemaOrValidator.validate(merged);
    if (result.isFailure) {
      const firstError = result.errors[0];
      throw (
        firstError ??
        VKError.validation(
          VKOptionsErrorCodes.Invalid,
          formatValidationFailure(result.errors),
        )
      );
    }
    return result.value;
  }

  if (isStandardSchema(schemaOrValidator)) {
    const outcome = schemaOrValidator['~standard'].validate(merged);
    if (outcome instanceof Promise) {
      throw new VKError(
        VKOptionsErrorCodes.Invalid,
        'Async Standard Schema validation is not supported in synchronous resolveOptions.',
      );
    }
    if (outcome.issues) {
      const fieldErrors = outcome.issues.map((issue) => ({
        path: issue.path
          ? issue.path
              .map((p) => (typeof p === 'object' && p !== null && 'key' in p ? String(p.key) : String(p)))
              .join('.')
          : '',
        code: VKOptionsErrorCodes.Invalid,
        message: issue.message,
      }));
      throw VKError.validation(
        VKOptionsErrorCodes.Invalid,
        formatValidationFailure(fieldErrors),
        { fieldErrors, extensions: { issues: outcome.issues } },
      );
    }
    return outcome.value as T;
  }

  const parsed = schemaOrValidator.safeParse(merged);

  if (!parsed.success) {
    const details = parsed.error.flatten ? parsed.error.flatten().fieldErrors : undefined;
    throw VKError.validation(
      VKOptionsErrorCodes.Invalid,
      formatValidationFailure(details ?? parsed.error.message),
      { extensions: (details as Record<string, unknown>) ?? {} },
    );
  }

  return parsed.data;
}

