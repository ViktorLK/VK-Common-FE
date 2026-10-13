// [CS.03] DOM-independent throttle utility with cancellation
export interface VKThrottleOptions {
  readonly leading?: boolean;
  readonly trailing?: boolean;
}

export interface VKThrottledFunction<TArgs extends readonly unknown[], TReturn = void> {
  (...args: TArgs): void;
  readonly cancel: () => void;
  readonly flush: () => void;
  readonly isPending: () => boolean;
}

/**
 * Creates a throttled function that only invokes fn at most once per every waitMs milliseconds.
 * Pure TypeScript implementation, completely independent of browser DOM.
 */
export function vkThrottle<TArgs extends readonly unknown[], TReturn = void>(
  fn: (...args: TArgs) => TReturn,
  waitMs: number,
  options?: VKThrottleOptions,
): VKThrottledFunction<TArgs, TReturn> {
  const leading = options?.leading ?? true;
  const trailing = options?.trailing ?? true;

  let timerId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: TArgs | undefined;
  let lastCallTime = 0;
  let hasTrailingCall = false;

  const cleanup = () => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
  };

  const cancel = () => {
    cleanup();
    lastArgs = undefined;
    lastCallTime = 0;
    hasTrailingCall = false;
  };

  const flush = () => {
    if (hasTrailingCall && lastArgs !== undefined) {
      const argsToCall = lastArgs;
      cancel();
      lastCallTime = Date.now();
      fn(...argsToCall);
    }
  };

  const isPending = () => timerId !== undefined || hasTrailingCall;

  const throttled = (...args: TArgs): void => {
    const now = Date.now();
    lastArgs = args;

    if (!lastCallTime && !leading) {
      lastCallTime = now;
    }

    const remaining = waitMs - (now - lastCallTime);

    if (remaining <= 0 || remaining > waitMs) {
      cleanup();
      lastCallTime = now;
      hasTrailingCall = false;
      fn(...args);
    } else if (trailing && timerId === undefined) {
      hasTrailingCall = true;
      timerId = setTimeout(() => {
        lastCallTime = leading ? Date.now() : 0;
        timerId = undefined;
        if (hasTrailingCall && lastArgs !== undefined) {
          hasTrailingCall = false;
          fn(...lastArgs);
        }
      }, remaining);
    }
  };

  throttled.cancel = cancel;
  throttled.flush = flush;
  throttled.isPending = isPending;

  return throttled;
}
