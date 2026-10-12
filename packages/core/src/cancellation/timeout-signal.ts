// [CS.03] AbortSignal timeout
/**
 * Creates an AbortSignal that aborts automatically after a timeout in milliseconds.
 * Uses native AbortSignal.timeout if supported, otherwise creates an AbortController with setTimeout.
 */
export function timeoutSignal(timeoutMs: number): AbortSignal {
  if (
    typeof AbortSignal !== 'undefined' &&
    'timeout' in AbortSignal &&
    typeof (AbortSignal as { timeout?: unknown }).timeout === 'function'
  ) {
    return (AbortSignal as { timeout: (ms: number) => AbortSignal }).timeout(timeoutMs);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error(`Operation timed out after ${timeoutMs}ms.`));
  }, timeoutMs);

  // Prevent Node.js process hang if unref is available
  if (typeof timer === 'object' && timer !== null && 'unref' in timer && typeof timer.unref === 'function') {
    timer.unref();
  }

  return controller.signal;
}
