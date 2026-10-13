// [AP.01] Type guard for StandardSchemaV1 contract
import type { StandardSchemaV1 } from './schema.types.js';

/**
 * Type guard to check if an object implements the official Standard Schema v1 specification.
 */
export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (!('~standard' in candidate) || typeof candidate['~standard'] !== 'object' || candidate['~standard'] === null) {
    return false;
  }

  const standardProps = candidate['~standard'] as Record<string, unknown>;
  return (
    standardProps['version'] === 1 &&
    typeof standardProps['vendor'] === 'string' &&
    typeof standardProps['validate'] === 'function'
  );
}

/**
 * Type guard conforming to VK prefix convention per AP.03.
 */
export const vkIsStandardSchema = isStandardSchema;
