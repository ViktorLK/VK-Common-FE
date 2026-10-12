// [OR.03] Exponential backoff calculation
import type { VKBackoffOptions } from './retry.types.js';

/**
 * Creates an exponential backoff calculation function.
 */
export function exponentialBackoff(
  options?: VKBackoffOptions,
): (attempt: number) => number {
  const base = options?.baseDelayMs ?? 500;
  const max = options?.maxDelayMs ?? 10000;
  const factor = options?.factor ?? 2;
  const jitter = options?.jitter ?? true;
  const random = options?.random ?? (() => Math.random());

  return (attempt: number): number => {
    const rawDelay = base * Math.pow(factor, Math.max(0, attempt));
    const bounded = Math.min(rawDelay, max);
    if (jitter) {
      // Full jitter: uniformly distributed between 0 and bounded
      return random() * bounded;
    }
    return bounded;
  };
}

/**
 * Computes exponential backoff with jitter (Item 27).
 * Can be invoked directly as a pure calculation `vkComputeBackoff(attempt, options)`,
 * or as a factory `vkComputeBackoff(options)` returning an attempt handler.
 */
export function vkComputeBackoff(attempt: number, options?: VKBackoffOptions): number;
export function vkComputeBackoff(options?: VKBackoffOptions): (attempt: number) => number;
export function vkComputeBackoff(
  attemptOrOptions?: number | VKBackoffOptions,
  maybeOptions?: VKBackoffOptions,
): number | ((attempt: number) => number) {
  if (typeof attemptOrOptions === 'number') {
    return exponentialBackoff(maybeOptions)(attemptOrOptions);
  }
  return exponentialBackoff(attemptOrOptions);
}

