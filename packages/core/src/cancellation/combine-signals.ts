// [CS.03] AbortSignal combination
/**
 * Combines multiple AbortSignals into a single signal that fires when any input signal aborts.
 * Uses native AbortSignal.any if available, otherwise provides a robust fallback.
 */
export function combineSignals(
  ...signals: readonly (AbortSignal | undefined | null)[]
): AbortSignal {
  const validSignals = signals.filter((s): s is AbortSignal => s != null);

  if (validSignals.length === 0) {
    return new AbortController().signal;
  }

  const firstSignal = validSignals[0];
  if (validSignals.length === 1 && firstSignal) {
    return firstSignal;
  }

  // Already aborted check
  for (const signal of validSignals) {
    if (signal.aborted) {
      return signal;
    }
  }

  // Use native AbortSignal.any if supported
  if (
    typeof AbortSignal !== 'undefined' &&
    'any' in AbortSignal &&
    typeof (AbortSignal as { any?: unknown }).any === 'function'
  ) {
    return (AbortSignal as { any: (signals: AbortSignal[]) => AbortSignal }).any(validSignals);
  }

  // Fallback implementation with automatic cleanup
  const controller = new AbortController();

  const cleanup = () => {
    for (const signal of validSignals) {
      signal.removeEventListener('abort', onAborted);
    }
  };

  const onAborted = (event: Event) => {
    const target = event.target as AbortSignal;
    cleanup();
    controller.abort(target.reason);
  };

  for (const signal of validSignals) {
    signal.addEventListener('abort', onAborted, { once: true });
  }

  return controller.signal;
}

/**
 * Alias conforming to VK prefix convention (Item 22).
 */
export const vkCombineSignals = combineSignals;

