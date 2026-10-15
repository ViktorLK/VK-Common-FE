// [AP.01] [OR.01] Development Actionable Diagnostics Formatter
// [ARCH-12] Perimeter Cross-Cutting Developer Experience
import type { VKDevWarnOptions } from './vk-diagnostic.types.js';
import { getVKDiagnosticDocsUrl } from './vk-diagnostic-codes.js';

// Global deduplication set for 'once: true' warnings within a browser/node runtime session
const warnedCodes = new Set<string>();

/**
 * Global build-time macro or fallback runtime check.
 */
declare const __DEV__: boolean | undefined;

function isDevEnvironment(): boolean {
  if (typeof __DEV__ !== 'undefined') {
    return Boolean(__DEV__);
  }
  return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
}

/**
 * Emits an actionable developer warning in development environments.
 * In production bundles with DCE enabled, branches wrapped in `if (__DEV__)` are completely stripped.
 *
 * @param code Centralized diagnostic code from VKDiagnosticCodes or custom string.
 * @param message Human-readable root cause explanation.
 * @param options Contextual component name, remediation hint, and deduplication options.
 */
export function vkDevWarn(
  code: string,
  message: string,
  options?: VKDevWarnOptions,
): void {
  if (!isDevEnvironment()) {
    return;
  }

  const once = options?.once ?? true;
  const dedupKey = `${code}::${message}`;
  if (once && warnedCodes.has(dedupKey)) {
    return;
  }
  if (once) {
    warnedCodes.add(dedupKey);
  }

  const docsUrl = getVKDiagnosticDocsUrl(code);
  const componentPrefix = options?.component ? ` <${options.component}>` : '';
  const scopePrefix = options?.scope ? ` [${options.scope}]` : '';

  const header = `⚠️ [VK.Blocks DX Warning${componentPrefix}${scopePrefix}: ${code}]`;
  const body = message;
  const hintLine = options?.hint ? `\n👉 Remediation: ${options.hint}` : '';
  const docsLine = `\n📖 Docs: ${docsUrl}`;

  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(`${header}\n${body}${hintLine}${docsLine}`);
  }
}

/**
 * Clears the warning deduplication cache. Primarily useful in test environments.
 */
export function clearVKDevWarnCache(): void {
  warnedCodes.clear();
}
