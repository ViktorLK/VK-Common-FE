// [FS-04] Nominal Service Token Factory
import type { VKServiceToken } from './provider.types.js';

/**
 * Creates a strongly-typed nominal service token for dependency injection.
 */
export function createVKServiceToken<T>(name: string): VKServiceToken<T> {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new TypeError('Service token name must be a non-empty string.');
  }
  return { name } as unknown as VKServiceToken<T>;
}
