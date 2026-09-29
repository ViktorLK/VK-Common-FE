import { z } from 'zod';

/**
 * Creates a validated environment configuration object.
 */
export function createVKEnv<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  source?: Record<string, string | undefined>,
): Readonly<z.infer<z.ZodObject<T>>> {
  // Use provided source or fallback to global process.env if available
  const envSource = source ?? (typeof process !== 'undefined' ? process.env : {});
  
  const result = schema.safeParse(envSource);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(`\u274c Environment validation failed:\n${JSON.stringify(formatted, null, 2)}`);
  }
  
  return Object.freeze(result.data);
}
