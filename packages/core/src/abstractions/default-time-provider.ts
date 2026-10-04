// [CS.06] Injected Time Provider default implementation (Zero dependencies, pure native Date)
import type { VKTimeProvider } from './abstractions.types.js';

export const defaultTimeProvider: VKTimeProvider = {
  now: () => new Date(),
  timestamp: () => Date.now(),
};
