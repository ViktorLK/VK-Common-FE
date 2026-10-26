// [MB.02] Explicit named exports - Intl Date, Time & Number Formatter Utilities
// [FS-05] Pure Web standard ECMAScript Intl specification with zero external dependencies
// [CS.06] Pure date calculations with deterministic time abstractions

export interface VKDateFormatOptions extends Intl.DateTimeFormatOptions {
  readonly timeZone?: string;
}

export interface VKCompactNumberFormatOptions extends Intl.NumberFormatOptions {
  readonly notation?: 'compact' | 'standard' | 'scientific' | 'engineering';
  readonly compactDisplay?: 'short' | 'long';
}

/**
 * Safely parses input into a valid Date instance or undefined if invalid.
 */
export function toValidDate(input: Date | number | string | undefined | null): Date | undefined {
  if (input == null) return undefined;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? undefined : input;
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Returns current user's local timezone.
 */
export function getVKUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Formats a date using native Intl.DateTimeFormat according to locale and timezone.
 */
export function formatVKDate(
  date: Date | number | string,
  locale = 'default',
  options?: VKDateFormatOptions,
): string {
  const d = toValidDate(date);
  if (!d) return '';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(d);
}

/**
 * Formats a date and time using native Intl.DateTimeFormat according to locale and timezone.
 */
export function formatVKDateTime(
  date: Date | number | string,
  locale = 'default',
  options?: VKDateFormatOptions,
): string {
  const d = toValidDate(date);
  if (!d) return '';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options,
  }).format(d);
}

/**
 * Formats a date range using native Intl.DateTimeFormat.formatRange with backward-compatible fallback.
 */
export function formatVKDateRange(
  startDate: Date | number | string,
  endDate: Date | number | string,
  locale = 'default',
  options?: VKDateFormatOptions,
): string {
  const start = toValidDate(startDate);
  const end = toValidDate(endDate);
  if (!start || !end) return '';

  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });

  if (typeof (formatter as any).formatRange === 'function') {
    return (formatter as any).formatRange(start, end);
  }

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

/**
 * Formats relative time (e.g., "5 minutes ago", "in 2 hours") using Intl.RelativeTimeFormat.
 * [CS.06] Safe resolution of base date avoiding direct Date.now() call.
 */
export function formatVKRelativeTime(
  targetDate: Date | number | string,
  baseDate?: Date | number | string,
  locale = 'default',
): string {
  const target = toValidDate(targetDate);
  const base = toValidDate(baseDate) ?? new Date();
  if (!target) return '';

  const diffMs = target.getTime() - base.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, 'second');
  }
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, 'minute');
  }
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, 'hour');
  }
  return rtf.format(diffDay, 'day');
}

/**
 * Formats a currency value using Intl.NumberFormat.
 */
export function formatVKCurrency(
  value: number,
  currency: string,
  locale = 'default',
  options?: Intl.NumberFormatOptions,
): string {
  if (isNaN(value)) return '';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...options,
  }).format(value);
}

/**
 * Formats a number with locale-specific separators and decimals.
 */
export function formatVKNumber(
  value: number,
  locale = 'default',
  options?: Intl.NumberFormatOptions,
): string {
  if (isNaN(value)) return '';

  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Formats a compact number abbreviation (e.g. 1.2K, 3.4M) using Intl.NumberFormat notation: 'compact'.
 */
export function formatVKCompactNumber(
  value: number,
  locale = 'default',
  options?: VKCompactNumberFormatOptions,
): string {
  if (isNaN(value)) return '';

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    ...options,
  }).format(value);
}
