// [OR.01] Logger factory implementation
import type { VKLogger, VKLoggerConfig } from './vk-logger.js';
import { ConsoleLogger } from './_internal/console-logger.js';

/**
 * Creates a structured logger adhering to [OR.01].
 */
export function createVKLogger(config?: VKLoggerConfig): VKLogger {
  return new ConsoleLogger(config);
}
