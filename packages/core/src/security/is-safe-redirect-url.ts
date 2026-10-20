// [OR.02] Open Redirect prevention utility
import type { VKRedirectValidationOptions } from './security.types.js';

/**
 * Validates whether a redirect URL is safe to navigate to, protecting against Open Redirect attacks.
 */
export function isSafeRedirectUrl(
  url?: string | null,
  options?: VKRedirectValidationOptions,
): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Strip ASCII control characters and whitespace
  // Browsers ignore control characters (e.g. \t, \r, \n) inside URLs
  const sanitized = url.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
  if (!sanitized) {
    return false;
  }

  // Reject dangerous pseudo-protocols
  if (/^(?:javascript|data|vbscript):/i.test(sanitized)) {
    return false;
  }

  // Reject scheme-relative URLs (e.g. "//evil.com") or backslash bypasses (e.g. "/\evil.com")
  if (
    sanitized.startsWith('//') ||
    sanitized.startsWith('/\\') ||
    sanitized.startsWith('\\\\') ||
    sanitized.startsWith('\\/')
  ) {
    return false;
  }

  const allowRelative = options?.allowRelative ?? true;

  // Safe relative paths starting with a single '/'
  if (sanitized.startsWith('/') && !sanitized.startsWith('//')) {
    return allowRelative;
  }

  // Absolute URLs check
  try {
    const parsed = new URL(sanitized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    if (options?.allowedOrigins && options.allowedOrigins.length > 0) {
      return options.allowedOrigins.some((origin) => {
        try {
          return new URL(origin).origin === parsed.origin;
        } catch {
          return false;
        }
      });
    }

    // If no allowedOrigins whitelist was provided, disallow arbitrary absolute origins by default
    return false;
  } catch {
    return false;
  }
}
