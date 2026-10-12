// [OR.01] Logger factory implementation
import type { VKLogger, VKLoggerConfig } from './logger.types.js';
import { ConsoleLogger } from './internal/console-logger.js';
import { vkNoopLogger } from './noop-logger.js';

/**
 * Creates a structured logger adhering to [OR.01].
 * Defaults to NoOp in production when no custom sink is provided.
 */
export function createVKLogger(config?: VKLoggerConfig): VKLogger {
  const isProd = config?.isProduction ?? false;
  const shouldDefaultToNoOp = config?.defaultToNoOpInProduction ?? isProd;
  if (shouldDefaultToNoOp && !config?.sink) {
    return vkNoopLogger;
  }
  return new ConsoleLogger(config);
}

