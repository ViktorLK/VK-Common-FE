// [OR.01] Logger factory implementation
import type { VKLogger, VKLoggerConfig } from './logger.types.js';
import { ConsoleLogger } from './internal/console-logger.js';

/**
 * Creates a structured logger adhering to [OR.01].
 */
export function createVKLogger(config?: VKLoggerConfig): VKLogger {
  return new ConsoleLogger(config);
}
