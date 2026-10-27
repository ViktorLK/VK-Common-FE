// [AP.04] [CS.03] [CS.01] [AP.01] Adaptive Polling Scheduler Hook with Page Visibility & Network Awareness
import { useState, useEffect, useRef, useCallback } from 'react';
import { type VKResult, type VKError, vkAssert } from '@vk-blocks/core';

export interface UseVKPollingOptions<TData> {
  /**
   * Async polling worker callback. Returning a typed VKResult<TData>.
   */
  readonly fn: (signal: AbortSignal) => Promise<VKResult<TData>>;
  /**
   * Base polling interval in milliseconds. Defaults to 5000.
   */
  readonly intervalMs?: number;
  /**
   * Whether polling is actively enabled. Defaults to true.
   */
  readonly enabled?: boolean;
  /**
   * Behavior when document/page is hidden:
   * - 'pause': completely pause polling until page becomes visible again (default).
   * - 'slow': slow down polling by multiplying interval.
   * - 'continue': keep polling at normal interval.
   */
  readonly backgroundBehavior?: 'pause' | 'slow' | 'continue';
  /**
   * Multiplier applied to intervalMs when backgroundBehavior is 'slow'. Defaults to 4.
   */
  readonly slowMultiplier?: number;
  /**
   * Whether to apply exponential backoff on consecutive errors. Defaults to true.
   */
  readonly backoffOnError?: boolean;
  /**
   * Maximum backoff delay cap in milliseconds. Defaults to 60000.
   */
  readonly maxBackoffMs?: number;
  /**
   * Callback fired on successful poll.
   */
  readonly onSuccess?: (data: TData) => void;
  /**
   * Callback fired on poll error.
   */
  readonly onError?: (errors: readonly VKError[]) => void;
}

export interface UseVKPollingResult<TData> {
  /** True while an active polling execution is underway. */
  readonly isPolling: boolean;
  /** True if polling is currently paused (due to tab hidden, offline, or manual pause). */
  readonly isPaused: boolean;
  /** Latest VKResult returned by the poller. */
  readonly lastResult: VKResult<TData> | undefined;
  /** Consecutive failure count since last success. */
  readonly consecutiveErrors: number;
  /** Currently effective polling interval in milliseconds. */
  readonly currentIntervalMs: number;
  /** Manually triggers an immediate poll. */
  readonly refresh: () => Promise<VKResult<TData>>;
  /** Manually pauses polling. */
  readonly pause: () => void;
  /** Manually resumes polling. */
  readonly resume: () => void;
}

/**
 * Intelligent adaptive polling scheduler hook (AP.04 / CS.03).
 * Dynamically adjusts cadence using Page Visibility API, network status, and exponential error backoff.
 */
export function useVKPolling<TData>(options: UseVKPollingOptions<TData>): UseVKPollingResult<TData> {
  vkAssert.notNull(options, 'options');
  vkAssert.notNull(options.fn, 'options.fn');

  const {
    fn,
    intervalMs = 5000,
    enabled = true,
    backgroundBehavior = 'pause',
    slowMultiplier = 4,
    backoffOnError = true,
    maxBackoffMs = 60000,
    onSuccess,
    onError,
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [lastResult, setLastResult] = useState<VKResult<TData> | undefined>(undefined);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  const fnRef = useRef(fn);
  fnRef.current = fn;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const isVisible = (): boolean => {
    if (typeof document !== 'undefined' && typeof document.visibilityState === 'string') {
      return document.visibilityState === 'visible';
    }
    return true;
  };

  const isOnline = (): boolean => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  };

  const calculateEffectiveInterval = (errorCount: number): number => {
    let current = intervalMs;

    if (!isVisible() && backgroundBehavior === 'slow') {
      current *= Math.max(1, slowMultiplier);
    }

    if (backoffOnError && errorCount > 0) {
      const backoff = current * Math.pow(2, errorCount - 1);
      current = Math.min(backoff, maxBackoffMs);
    }

    return current;
  };

  const currentIntervalMs = calculateEffectiveInterval(consecutiveErrors);

  const shouldPoll = (): boolean => {
    if (!enabled || manualPaused) return false;
    if (!isOnline()) return false;
    if (!isVisible() && backgroundBehavior === 'pause') return false;
    return true;
  };

  const abortControllerRef = useRef<AbortController | null>(null);

  const executePoll = useCallback(async (): Promise<VKResult<TData>> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsPolling(true);
    try {
      const res = await fnRef.current(controller.signal);
      setLastResult(res);

      if (res.isSuccess) {
        setConsecutiveErrors(0);
        onSuccessRef.current?.(res.value);
      } else {
        setConsecutiveErrors((prev) => prev + 1);
        onErrorRef.current?.(res.errors);
      }
      return res;
    } finally {
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    if (!shouldPoll()) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      const delay = calculateEffectiveInterval(consecutiveErrors);
      timer = setTimeout(async () => {
        if (shouldPoll()) {
          await executePoll();
          scheduleNext();
        }
      }, delay);
    };

    scheduleNext();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldPoll()) {
        void executePoll();
      }
    };

    const handleOnline = () => {
      if (shouldPoll()) {
        void executePoll();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
    };
  }, [
    enabled,
    manualPaused,
    intervalMs,
    backgroundBehavior,
    slowMultiplier,
    backoffOnError,
    maxBackoffMs,
    consecutiveErrors,
    executePoll,
  ]);

  const pause = useCallback(() => setManualPaused(true), []);
  const resume = useCallback(() => setManualPaused(false), []);

  return {
    isPolling,
    isPaused: !shouldPoll(),
    lastResult,
    consecutiveErrors,
    currentIntervalMs,
    refresh: executePoll,
    pause,
    resume,
  };
}
