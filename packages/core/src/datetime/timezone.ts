// [CS.06 / FS-05 / AP.01] Universal DateTime timezone conversion via native Intl (Zero external dependencies)
import { VKResult } from '../result/vk-result.js';
import { VKError } from '../errors/vk-error.js';
import { VKDatetimeErrorCodes } from './datetime.errors.js';
import type { VKTimeZoneFormatOptions } from './datetime.types.js';

/**
 * Checks whether an IANA timezone identifier is valid and supported by the runtime Intl engine.
 */
export function vkIsValidTimeZone(timeZone: string): boolean {
  if (typeof timeZone !== 'string' || timeZone.trim().length === 0) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timeZone.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculates the timezone offset in minutes relative to UTC for a specific date (e.g., +540 for Asia/Tokyo).
 * Returns a typed VKResult<number>.
 */
export function tryGetTimeZoneOffset(timeZone: string, date: Date = new Date()): VKResult<number> {
  const trimmed = typeof timeZone === 'string' ? timeZone.trim() : '';
  if (!vkIsValidTimeZone(trimmed)) {
    return VKResult.failure(
      VKError.validation(
        VKDatetimeErrorCodes.InvalidTimeZone,
        `Invalid IANA time zone identifier: '${String(timeZone)}'.`,
      ),
    );
  }

  if (Number.isNaN(date.getTime())) {
    return VKResult.failure(
      VKError.validation(
        VKDatetimeErrorCodes.InvalidValue,
        'Cannot compute time zone offset for an invalid Date instance.',
      ),
    );
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: trimmed,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);
    const map: Record<string, string> = {};
    for (const part of parts) {
      map[part.type] = part.value;
    }

    const year = Number(map.year);
    const month = Number(map.month);
    const day = Number(map.day);
    const hour = Number(map.hour);
    const minute = Number(map.minute);
    const second = Number(map.second);
    const millisecond = Number(map.fractionalSecond ?? 0);

    const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
    const offsetMs = wallClockUtc - date.getTime();
    const offsetMinutes = Math.round(offsetMs / 60000);

    return VKResult.success(offsetMinutes);
  } catch (err) {
    return VKResult.failure(
      VKError.failure(
        VKDatetimeErrorCodes.InvalidTimeZone,
        `Failed to compute timezone offset for '${trimmed}': ${String(err)}`,
      ),
    );
  }
}

/**
 * Calculates the timezone offset in minutes relative to UTC (e.g. +540 for Asia/Tokyo).
 * Throws a typed VKError on invalid timezone or date.
 */
export function vkGetTimeZoneOffset(timeZone: string, date?: Date): number {
  const result = tryGetTimeZoneOffset(timeZone, date);
  if (result.isFailure) {
    throw result.errors[0];
  }
  return result.value;
}

/**
 * Converts a Date to a wall-clock representation in the target timezone.
 * Returns a new Date whose UTC methods reflect the target timezone's wall-clock values.
 */
export function tryConvertTimeZone(date: Date, targetTimeZone: string): VKResult<Date> {
  const offsetRes = tryGetTimeZoneOffset(targetTimeZone, date);
  if (offsetRes.isFailure) {
    return VKResult.failure(offsetRes.errors[0]);
  }

  const offsetMinutes = offsetRes.value;
  const converted = new Date(date.getTime() + offsetMinutes * 60000);
  return VKResult.success(converted);
}

/**
 * Converts a Date to a wall-clock representation in the target timezone.
 * Throws a typed VKError on invalid timezone or date.
 */
export function vkConvertTimeZone(date: Date, targetTimeZone: string): Date {
  const result = tryConvertTimeZone(date, targetTimeZone);
  if (result.isFailure) {
    throw result.errors[0];
  }
  return result.value;
}

/**
 * Safely formats a Date into a string in the specified timezone using native Intl.
 */
export function tryFormatToTimeZone(
  date: Date,
  targetTimeZone: string,
  options?: VKTimeZoneFormatOptions,
): VKResult<string> {
  const trimmed = typeof targetTimeZone === 'string' ? targetTimeZone.trim() : '';
  if (!vkIsValidTimeZone(trimmed)) {
    return VKResult.failure(
      VKError.validation(
        VKDatetimeErrorCodes.InvalidTimeZone,
        `Invalid IANA time zone identifier: '${String(targetTimeZone)}'.`,
      ),
    );
  }

  if (Number.isNaN(date.getTime())) {
    return VKResult.failure(
      VKError.validation(
        VKDatetimeErrorCodes.InvalidValue,
        'Cannot format an invalid Date instance.',
      ),
    );
  }

  try {
    const locale = options?.locale ?? 'en-US';
    const formatter = new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone: trimmed,
    });
    return VKResult.success(formatter.format(date));
  } catch (err) {
    return VKResult.failure(
      VKError.failure(
        VKDatetimeErrorCodes.InvalidFormat,
        `Failed to format date in timezone '${trimmed}': ${String(err)}`,
      ),
    );
  }
}

/**
 * Formats a Date into a string in the specified timezone using native Intl.
 */
export function vkFormatToTimeZone(
  date: Date,
  targetTimeZone: string,
  options?: VKTimeZoneFormatOptions,
): string {
  const result = tryFormatToTimeZone(date, targetTimeZone, options);
  if (result.isFailure) {
    throw result.errors[0];
  }
  return result.value;
}
