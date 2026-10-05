// [CS.07] Zod-based validated environment configuration
import { z } from 'zod';
import { VKError } from '../errors/vk-error.js';
import { VKEnvErrorCodes } from './env.errors.js';

/**
 * Creates a validated environment configuration object from an injected source.
 */
export function createVKEnv<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  source: Record<string, string | undefined>,
): Readonly<z.infer<z.ZodObject<T>>> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw VKError.validation(
      VKEnvErrorCodes.Invalid,
      `Environment validation failed: ${JSON.stringify(formatted)}`,
      { extensions: formatted },
    );
  }

  return Object.freeze(result.data);
}
