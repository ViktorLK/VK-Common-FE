// [CS.07] Validated environment configuration
import { VKError } from '../errors/vk-error.js';
import { isStandardSchema } from '../schema/index.js';
import { VKEnvErrorCodes } from './env.errors.js';
import type { VKStandardSchema, VKOptionsValidator } from '../options/options.types.js';

function isOptionsValidator<T>(
  target: VKStandardSchema<T> | VKOptionsValidator<T>,
): target is VKOptionsValidator<T> {
  return typeof (target as { validate?: unknown }).validate === 'function' && !('~standard' in (target as object));
}

/**
 * Creates a validated environment configuration object from an injected source.
 */
export function createVKEnv<T>(
  schemaOrValidator: VKStandardSchema<T> | VKOptionsValidator<T>,
  source: Record<string, string | undefined>,
): Readonly<T> {
  if (isOptionsValidator(schemaOrValidator)) {
    const outcome = schemaOrValidator.validate(source);
    if (outcome.isFailure) {
      throw (
        outcome.errors[0] ??
        VKError.validation(
          VKEnvErrorCodes.Invalid,
          'Environment validation failed.',
        )
      );
    }
    return Object.freeze(outcome.value);
  }

  if (isStandardSchema(schemaOrValidator)) {
    const outcome = schemaOrValidator['~standard'].validate(source);
    if (outcome instanceof Promise) {
      throw new VKError(
        VKEnvErrorCodes.Invalid,
        'Async Standard Schema validation is not supported in synchronous createVKEnv.',
      );
    }
    if (outcome.issues) {
      const formatted: Record<string, string[]> = {};
      for (const issue of outcome.issues) {
        const key = issue.path
          ? issue.path
              .map((p) => (typeof p === 'object' && p !== null && 'key' in p ? String(p.key) : String(p)))
              .join('.')
          : '_';
        if (!formatted[key]) {
          formatted[key] = [];
        }
        formatted[key].push(issue.message);
      }
      throw VKError.validation(
        VKEnvErrorCodes.Invalid,
        `Environment validation failed: ${JSON.stringify(formatted)}`,
        { extensions: formatted },
      );
    }
    return Object.freeze(outcome.value as T);
  }

  const result = schemaOrValidator.safeParse(source);

  if (!result.success) {
    const formatted = result.error.flatten ? result.error.flatten().fieldErrors : undefined;
    throw VKError.validation(
      VKEnvErrorCodes.Invalid,
      `Environment validation failed: ${JSON.stringify(formatted ?? result.error.message)}`,
      { extensions: (formatted as Record<string, unknown>) ?? {} },
    );
  }

  return Object.freeze(result.data);
}

