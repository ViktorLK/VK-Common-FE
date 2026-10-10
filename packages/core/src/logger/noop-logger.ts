// [OR.01] NoOp logger implementation (Fallback-tier zero overhead)
import type { VKLogger } from './logger.types.js';

export const noopLogger: VKLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  child: () => noopLogger,
};

/**
 * Alias conforming to VK prefix convention (Item 30).
 */
export const vkNoopLogger: VKLogger = noopLogger;

