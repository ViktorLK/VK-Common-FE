// [AP.01] Modern TypeScript type guard
// [CS.03] AbortSignal and cancellation error checking

/**
 * Type guard: value is an AbortError.
 */
export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const name = (error as { name?: string }).name;
  return name === 'AbortError';
}

/**
 * Alias conforming to VK prefix convention (Item 24).
 */
export const vkIsAbortError = isAbortError;

