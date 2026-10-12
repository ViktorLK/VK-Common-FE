// [CS.03] DOM-independent debounce utility with cancellation
export interface VKDebounceOptions {
  readonly leading?: boolean;
  readonly maxWaitMs?: number;
}

export interface VKDebouncedFunction<TArgs extends readonly unknown[], TReturn = void> {
  (...args: TArgs): void;
  readonly cancel: () => void;
  readonly flush: () => void;
  readonly isPending: () => boolean;
}

/**
 * Creates a debounced function that delays invoking fn until after waitMs milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * Pure TypeScript implementation, completely independent of browser DOM.
 */
export function vkDebounce<TArgs extends readonly unknown[], TReturn = void>(
  fn: (...args: TArgs) => TReturn,
  waitMs: number,
  options?: VKDebounceOptions,
): VKDebouncedFunction<TArgs, TReturn> {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  let maxTimerId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: TArgs | undefined;
  let hasPendingCall = false;

  const leading = options?.leading ?? false;
  const maxWaitMs = options?.maxWaitMs;

  const invoke = () => {
    if (hasPendingCall && lastArgs !== undefined) {
      const argsToCall = lastArgs;
      lastArgs = undefined;
      hasPendingCall = false;
      cleanupTimers();
      fn(...argsToCall);
    }
  };

  const cleanupTimers = () => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
    if (maxTimerId !== undefined) {
      clearTimeout(maxTimerId);
      maxTimerId = undefined;
    }
  };

  const cancel = () => {
    cleanupTimers();
    lastArgs = undefined;
    hasPendingCall = false;
  };

  const flush = () => {
    if (hasPendingCall) {
      invoke();
    }
  };

  const isPending = () => hasPendingCall || timerId !== undefined;

  const debounced = (...args: TArgs): void => {
    lastArgs = args;
    hasPendingCall = true;

    const shouldCallNow = leading && timerId === undefined;

    if (timerId !== undefined) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      timerId = undefined;
      if (!leading || hasPendingCall) {
        invoke();
      }
    }, waitMs);

    if (maxWaitMs !== undefined && maxTimerId === undefined) {
      maxTimerId = setTimeout(() => {
        maxTimerId = undefined;
        invoke();
      }, maxWaitMs);
    }

    if (shouldCallNow) {
      hasPendingCall = false;
      fn(...args);
    }
  };

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.isPending = isPending;

  return debounced;
}
