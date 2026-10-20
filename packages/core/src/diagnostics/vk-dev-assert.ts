// [AP.01] [CS.01] Development invariant assertion with actionable diagnostics
import { VKError } from '../errors/vk-error.js';
import { vkDevWarn } from './vk-dev-warn.js';
import type { VKDevWarnOptions } from './vk-diagnostic.types.js';
import { getVKDiagnosticDocsUrl } from './vk-diagnostic-codes.js';

declare const __DEV__: boolean | undefined;

function isDevEnvironment(): boolean {
  if (typeof __DEV__ !== 'undefined') {
    return Boolean(__DEV__);
  }
  return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
}

/**
 * Asserts that a condition is true in development mode.
 * If false, emits an actionable warning and throws a structured VKError in dev scenarios.
 */
export function vkDevAssert(
  condition: unknown,
  code: string,
  message: string,
  options?: VKDevWarnOptions,
): asserts condition {
  if (condition) {
    return;
  }

  if (isDevEnvironment()) {
    const docsUrl = getVKDiagnosticDocsUrl(code);
    const fullMessage = `${message} (See ${docsUrl} for remediation).`;
    vkDevWarn(code, message, options);
    throw VKError.failure(code, fullMessage);
  }
}
