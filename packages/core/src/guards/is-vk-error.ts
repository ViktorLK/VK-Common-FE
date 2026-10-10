// [AP.01] Modern TypeScript type guard
// [CS.01] VKError shape verification
import type { VKErrorLike } from './guards.types.js';

export type { VKErrorLike };

/**
 * Type guard: value conforms to the VKError shape.
 */
export function vkIsError(value: unknown): value is VKErrorLike {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['code'] === 'string' &&
    typeof candidate['description'] === 'string'
  );
}

/**
 * @deprecated Use vkIsError instead per naming convention.
 */
export const isVKError = vkIsError;

