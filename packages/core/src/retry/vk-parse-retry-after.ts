// [FS-06] Parse Retry-After header into delay milliseconds
export interface VKParseRetryAfterOptions {
  /**
   * Current time provider in milliseconds. Defaults to Date.now.
   */
  readonly nowMs?: () => number;
  /**
   * Default fallback delay in milliseconds if the header is empty or invalid. Defaults to 0.
   */
  readonly defaultMs?: number;
  /**
   * Maximum allowed delay cap in milliseconds.
   */
  readonly maxMs?: number;
}

/**
 * Parses a standard HTTP Retry-After header (either seconds or an HTTP-date) into milliseconds.
 * Complies with RFC 7231 / RFC 9110 and [FS-06] for handling HTTP 429 and 503 responses.
 */
export function vkParseRetryAfter(
  retryAfter: string | number | null | undefined,
  options?: VKParseRetryAfterOptions,
): number {
  const defaultMs = options?.defaultMs ?? 0;
  const maxMs = options?.maxMs;
  const nowMs = options?.nowMs ?? (() => Date.now());

  if (retryAfter === null || retryAfter === undefined) {
    return defaultMs;
  }

  // Direct number input
  if (typeof retryAfter === 'number') {
    if (Number.isNaN(retryAfter) || !Number.isFinite(retryAfter) || retryAfter < 0) {
      return defaultMs;
    }
    const ms = Math.round(retryAfter * 1000);
    return maxMs !== undefined ? Math.min(ms, maxMs) : ms;
  }

  const trimmed = retryAfter.trim();
  if (trimmed.length === 0) {
    return defaultMs;
  }

  // Integer seconds format (e.g. "120")
  if (/^\d+$/.test(trimmed)) {
    const seconds = parseInt(trimmed, 10);
    if (!Number.isFinite(seconds) || seconds < 0) {
      return defaultMs;
    }
    const ms = seconds * 1000;
    return maxMs !== undefined ? Math.min(ms, maxMs) : ms;
  }

  // HTTP-Date format (e.g. "Wed, 21 Oct 2026 07:28:00 GMT")
  const parsedDate = new Date(trimmed);
  const targetTime = parsedDate.getTime();
  if (!Number.isNaN(targetTime)) {
    const current = nowMs();
    const diff = targetTime - current;
    const bounded = Math.max(0, diff);
    return maxMs !== undefined ? Math.min(bounded, maxMs) : bounded;
  }

  return defaultMs;
}
