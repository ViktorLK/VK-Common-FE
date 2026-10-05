// [OR.01] Log data sanitization (Redaction of passwords, tokens, API keys, JWT)
import { DEFAULT_REDACT_KEYS } from './logger.constants.js';

const BEARER_REGEX = /Bearer\s+([A-Za-z0-9\-._~+/]+=*)/gi;
const JWT_REGEX = /\beyJ[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}\b/g;

/**
 * Normalizes sensitive key names to lowercase alphanumeric only.
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[-_]/g, '');
}

/**
 * Redacts sensitive fields from objects or strings.
 */
export function redact<T>(
  input: T,
  customKeys?: readonly string[],
  customPatterns?: readonly RegExp[],
): T {
  const sensitiveKeys = new Set(
    (customKeys ?? DEFAULT_REDACT_KEYS).map(normalizeKey),
  );

  const seen = new WeakSet<object>();

  function sanitize(val: unknown, depth = 0): unknown {
    if (depth > 10) return val;

    if (typeof val === 'string') {
      let str = val.replace(BEARER_REGEX, 'Bearer [REDACTED]');
      str = str.replace(JWT_REGEX, '[REDACTED_JWT]');
      if (customPatterns) {
        for (const pattern of customPatterns) {
          str = str.replace(pattern, '[REDACTED]');
        }
      }
      return str;
    }

    if (val instanceof Error) {
      return {
        name: val.name,
        message: sanitize(val.message, depth + 1),
        ...(val.stack ? { stack: sanitize(val.stack, depth + 1) } : {}),
        ...('code' in val ? { code: (val as { code?: unknown }).code } : {}),
      };
    }

    if (Array.isArray(val)) {
      return val.map((item) => sanitize(item, depth + 1));
    }

    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) {
        return '[Circular]';
      }
      seen.add(val);

      const sanitizedObj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val)) {
        if (sensitiveKeys.has(normalizeKey(k))) {
          sanitizedObj[k] = '[REDACTED]';
        } else {
          sanitizedObj[k] = sanitize(v, depth + 1);
        }
      }
      return sanitizedObj;
    }

    return val;
  }

  return sanitize(input) as T;
}
