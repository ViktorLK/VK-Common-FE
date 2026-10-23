// [AP.01] Creation of disposable instances
import type { VKDisposable } from './disposable.types.js';

/**
 * Wraps a cleanup function into a standard VKDisposable object.
 */
export function toDisposable(cleanup: () => void): VKDisposable {
  let isDisposed = false;
  const disposable: VKDisposable = {
    dispose: () => {
      if (!isDisposed) {
        isDisposed = true;
        cleanup();
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
