// [AP.01] Modern TypeScript type guard
// [CS.01] VKResult shape verification
import type { VKResultLike } from './guards.types.js';

export type { VKResultLike };

/**
 * Type guard: value conforms to the VKResult shape.
 */
export function isVKResult<T = unknown>(value: unknown): value is VKResultLike<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['isSuccess'] === 'boolean' &&
    typeof candidate['isFailure'] === 'boolean' &&
    Array.isArray(candidate['errors'])
  );
}
