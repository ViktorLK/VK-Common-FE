// [OR.01] Safe disposal execution: isolated error handling
import type { VKDisposable, VKCombineDisposablesOptions } from './disposable.types.js';

/**
 * Combines multiple disposables into a single VKDisposable.
 * All disposables are called even if one throws.
 */
export function combineDisposables(
  ...disposables: readonly (VKDisposable | undefined | null)[]
): VKDisposable;
export function combineDisposables(
  options: VKCombineDisposablesOptions,
  ...disposables: readonly (VKDisposable | undefined | null)[]
): VKDisposable;
export function combineDisposables(
  first?: VKCombineDisposablesOptions | VKDisposable | null,
  ...rest: readonly (VKDisposable | undefined | null)[]
): VKDisposable {
  let options: VKCombineDisposablesOptions = {};
  let list: readonly (VKDisposable | undefined | null)[] = [];

  if (first && typeof (first as VKDisposable).dispose !== 'function' && !('dispose' in first)) {
    options = first as VKCombineDisposablesOptions;
    list = rest;
  } else {
    list = [first as VKDisposable | undefined | null, ...rest];
  }

  let isDisposed = false;
  const disposable: VKDisposable = {
    dispose: () => {
      if (isDisposed) return;
      isDisposed = true;
      const errors: unknown[] = [];

      for (const d of list) {
        if (!d) continue;
        try {
          d.dispose();
        } catch (e: unknown) {
          if (options.onError) {
            options.onError(e);
          } else {
            errors.push(e);
          }
        }
      }

      if (errors.length === 1) {
        throw errors[0];
      } else if (errors.length > 1) {
        if (typeof AggregateError !== 'undefined') {
          throw new AggregateError(errors, 'Multiple errors occurred during disposal.');
        } else {
          throw errors[0];
        }
      }
    },
  };

  if (typeof Symbol !== 'undefined' && 'dispose' in Symbol) {
    (disposable as unknown as Record<symbol, unknown>)[Symbol.dispose] = function (this: VKDisposable) {
      this.dispose();
    };
  }

  return disposable;
}
