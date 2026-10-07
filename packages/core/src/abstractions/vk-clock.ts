// [FS-05] Clock port and controllable test clock implementation
/**
 * Clock port abstraction for returning current date and timestamps.
 * Eliminates direct, non-deterministic system clock reads across domain and application logic.
 */
export interface VKClock {
  readonly now: () => Date;
  readonly timestamp: () => number;
}

/**
 * Controllable clock implementation for deterministic testing.
 */
export interface VKTestClock extends VKClock {
  readonly setTime: (dateOrMs: Date | number) => void;
  readonly advance: (ms: number) => void;
}

/**
 * Default production clock backed by the native system time.
 */
export const defaultClock: VKClock = {
  now: () => new Date(),
  timestamp: () => Date.now(),
};

/**
 * Creates a controllable test clock initialized to a specific time.
 */
export function createSettableClock(initialDateOrMs: Date | number = Date.now()): VKTestClock {
  let currentMs = typeof initialDateOrMs === 'number' ? initialDateOrMs : initialDateOrMs.getTime();

  return {
    now: () => new Date(currentMs),
    timestamp: () => currentMs,
    setTime: (dateOrMs: Date | number) => {
      currentMs = typeof dateOrMs === 'number' ? dateOrMs : dateOrMs.getTime();
    },
    advance: (ms: number) => {
      currentMs += ms;
    },
  };
}
