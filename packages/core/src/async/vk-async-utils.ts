// [CS.03] Async utilities with cancellation and concurrency primitives
// [AP.01] Strict typing: zero any
// [CS.06] Time abstraction injected for deterministic timing
import { defaultTimeProvider, VKTimeProvider } from '../abstractions/vk-time-provider.js';

export async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error(signal.reason || 'Cancelled delay.'));
    }

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new Error(signal?.reason || 'Cancelled delay.'));
    };

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort);
  });
}

export function debounce<T extends (...args: readonly unknown[]) => void>(
  fn: T,
  waitMs: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, waitMs);
  };
}

export function throttle<T extends (...args: readonly unknown[]) => void>(
  fn: T,
  intervalMs: number,
  timeProvider: VKTimeProvider = defaultTimeProvider,
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = timeProvider.timestamp();
    if (now - lastTime >= intervalMs) {
      lastTime = now;
      fn(...args);
    }
  };
}

export function createMutex(): { run: <T>(fn: () => Promise<T>) => Promise<T> } {
  let currentPromise: Promise<unknown> = Promise.resolve();

  return {
    run: async <T>(fn: () => Promise<T>): Promise<T> => {
      const nextPromise = currentPromise.then(() => fn());
      currentPromise = nextPromise.catch(() => {});
      return nextPromise;
    },
  };
}
