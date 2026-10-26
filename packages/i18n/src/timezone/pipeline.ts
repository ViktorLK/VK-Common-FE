// [MB.02] Explicit typed factory - Dynamic Timezone Shift Pipeline
// [FS-05] Pure Web standard ECMAScript Intl & Timezone specifications
// [AP.01] Modern TypeScript Semantics: Defensive boundary validation with zero any

import {
  toValidDate,
  getVKUserTimeZone,
  formatVKDate,
  formatVKDateTime,
  formatVKDateRange,
} from '../datetime/formatters.js';
import type {
  DateInput,
  VKTimezoneDateParts,
  VKTimezonePipeline,
  VKTimezonePipelineOptions,
} from './timezone.types.js';

interface RawCalendarParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * Extracts raw calendar parts in a specific timezone using Intl.DateTimeFormat.
 */
function extractRawParts(date: Date, timeZone: string, fallbackTz: string): RawCalendarParts {
  const tryFormat = (tz: string): RawCalendarParts | null => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hourCycle: 'h23',
      });
      const parts = formatter.formatToParts(date);
      let year = date.getFullYear();
      let month = date.getMonth();
      let day = date.getDate();
      let hour = 0;
      let minute = 0;
      let second = 0;

      for (const part of parts) {
        if (part.type === 'year') year = parseInt(part.value, 10);
        else if (part.type === 'month') month = parseInt(part.value, 10) - 1;
        else if (part.type === 'day') day = parseInt(part.value, 10);
        else if (part.type === 'hour') hour = parseInt(part.value, 10);
        else if (part.type === 'minute') minute = parseInt(part.value, 10);
        else if (part.type === 'second') second = parseInt(part.value, 10);
      }

      return { year, month, day, hour, minute, second };
    } catch {
      return null;
    }
  };

  const primary = tryFormat(timeZone);
  if (primary) return primary;

  const fallback = tryFormat(fallbackTz);
  if (fallback) return fallback;

  // Ultimate fallback to UTC parts
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  };
}

/**
 * Calculates exact timezone offset in minutes relative to UTC at the specified date.
 */
function computeOffsetMinutes(date: Date, timeZone: string, fallbackTz: string): number {
  const target = extractRawParts(date, timeZone, fallbackTz);
  const utc = extractRawParts(date, 'UTC', 'UTC');

  const targetUtcMs = Date.UTC(
    target.year,
    target.month,
    target.day,
    target.hour,
    target.minute,
    target.second,
  );
  const realUtcMs = Date.UTC(
    utc.year,
    utc.month,
    utc.day,
    utc.hour,
    utc.minute,
    utc.second,
  );

  return Math.round((targetUtcMs - realUtcMs) / (60 * 1000));
}

/**
 * Formats offset in minutes into an ISO offset string (e.g. "+09:00", "-04:30", "Z").
 */
function formatOffsetString(offsetMinutes: number): string {
  if (offsetMinutes === 0) return 'Z';
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hours = String(Math.floor(abs / 60)).padStart(2, '0');
  const mins = String(abs % 60).padStart(2, '0');
  return `${sign}${hours}:${mins}`;
}

/**
 * Creates an enterprise-grade Timezone Shift Pipeline.
 */
export function createVKTimezonePipeline(
  options?: VKTimezonePipelineOptions,
): VKTimezonePipeline {
  const fallbackTimezone = options?.fallbackTimezone ?? 'UTC';
  const userTimezone = options?.userTimezone ?? getVKUserTimeZone();
  const serverTimezone = options?.serverTimezone ?? 'UTC';
  const locale = options?.locale ?? 'default';

  const getTimezoneOffsetMinutes = (tz?: string, date?: DateInput): number => {
    const d = toValidDate(date) ?? new Date();
    const resolvedTz = tz ?? userTimezone;
    return computeOffsetMinutes(d, resolvedTz, fallbackTimezone);
  };

  const getOffsetDifferenceMs = (tz1: string, tz2: string, date?: DateInput): number => {
    const d = toValidDate(date) ?? new Date();
    const off1 = computeOffsetMinutes(d, tz1, fallbackTimezone);
    const off2 = computeOffsetMinutes(d, tz2, fallbackTimezone);
    return (off1 - off2) * 60 * 1000;
  };

  const project = (date: DateInput, timeZone?: string): VKTimezoneDateParts => {
    const d = toValidDate(date) ?? new Date();
    const resolvedTz = timeZone ?? userTimezone;
    const parts = extractRawParts(d, resolvedTz, fallbackTimezone);
    const offsetMinutes = computeOffsetMinutes(d, resolvedTz, fallbackTimezone);

    return {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: parts.hour,
      minute: parts.minute,
      second: parts.second,
      millisecond: d.getMilliseconds(),
      timeZone: resolvedTz,
      offsetMinutes,
      offsetFormatted: formatOffsetString(offsetMinutes),
    };
  };

  const toStartOfDay = (date: DateInput, timeZone?: string): Date => {
    const d = toValidDate(date) ?? new Date();
    const resolvedTz = timeZone ?? userTimezone;
    const p = extractRawParts(d, resolvedTz, fallbackTimezone);
    const targetLocalUtc = Date.UTC(p.year, p.month, p.day, 0, 0, 0, 0);
    const offsetMs = computeOffsetMinutes(new Date(targetLocalUtc), resolvedTz, fallbackTimezone) * 60 * 1000;
    return new Date(targetLocalUtc - offsetMs);
  };

  const toEndOfDay = (date: DateInput, timeZone?: string): Date => {
    const d = toValidDate(date) ?? new Date();
    const resolvedTz = timeZone ?? userTimezone;
    const p = extractRawParts(d, resolvedTz, fallbackTimezone);
    const targetLocalUtc = Date.UTC(p.year, p.month, p.day, 23, 59, 59, 999);
    const offsetMs = computeOffsetMinutes(new Date(targetLocalUtc), resolvedTz, fallbackTimezone) * 60 * 1000;
    return new Date(targetLocalUtc - offsetMs);
  };

  const toStartOfMonth = (date: DateInput, timeZone?: string): Date => {
    const d = toValidDate(date) ?? new Date();
    const resolvedTz = timeZone ?? userTimezone;
    const p = extractRawParts(d, resolvedTz, fallbackTimezone);
    const targetLocalUtc = Date.UTC(p.year, p.month, 1, 0, 0, 0, 0);
    const offsetMs = computeOffsetMinutes(new Date(targetLocalUtc), resolvedTz, fallbackTimezone) * 60 * 1000;
    return new Date(targetLocalUtc - offsetMs);
  };

  const toEndOfMonth = (date: DateInput, timeZone?: string): Date => {
    const d = toValidDate(date) ?? new Date();
    const resolvedTz = timeZone ?? userTimezone;
    const p = extractRawParts(d, resolvedTz, fallbackTimezone);
    // Find last day of the month by requesting day 0 of month + 1
    const lastDay = new Date(Date.UTC(p.year, p.month + 1, 0)).getUTCDate();
    const targetLocalUtc = Date.UTC(p.year, p.month, lastDay, 23, 59, 59, 999);
    const offsetMs = computeOffsetMinutes(new Date(targetLocalUtc), resolvedTz, fallbackTimezone) * 60 * 1000;
    return new Date(targetLocalUtc - offsetMs);
  };

  const shift = (date: DateInput, fromTz: string, toTz: string): Date => {
    const d = toValidDate(date) ?? new Date();
    const diffMs = getOffsetDifferenceMs(fromTz, toTz, d);
    return new Date(d.getTime() - diffMs);
  };

  const toServerTime = (userLocalDate: DateInput): Date => {
    return shift(userLocalDate, userTimezone, serverTimezone);
  };

  const toDisplayTime = (serverDate: DateInput): Date => {
    return shift(serverDate, serverTimezone, userTimezone);
  };

  const isSameDate = (d1: DateInput, d2: DateInput, timeZone?: string): boolean => {
    const dt1 = toValidDate(d1);
    const dt2 = toValidDate(d2);
    if (!dt1 || !dt2) return false;
    const resolvedTz = timeZone ?? userTimezone;
    const p1 = extractRawParts(dt1, resolvedTz, fallbackTimezone);
    const p2 = extractRawParts(dt2, resolvedTz, fallbackTimezone);
    return p1.year === p2.year && p1.month === p2.month && p1.day === p2.day;
  };

  const isSameMonth = (d1: DateInput, d2: DateInput, timeZone?: string): boolean => {
    const dt1 = toValidDate(d1);
    const dt2 = toValidDate(d2);
    if (!dt1 || !dt2) return false;
    const resolvedTz = timeZone ?? userTimezone;
    const p1 = extractRawParts(dt1, resolvedTz, fallbackTimezone);
    const p2 = extractRawParts(dt2, resolvedTz, fallbackTimezone);
    return p1.year === p2.year && p1.month === p2.month;
  };

  const formatDate = (date: DateInput, formatOptions?: Intl.DateTimeFormatOptions): string => {
    const d = toValidDate(date);
    if (!d) return '';
    return formatVKDate(d, locale, {
      timeZone: userTimezone,
      ...formatOptions,
    });
  };

  const formatDateTime = (date: DateInput, formatOptions?: Intl.DateTimeFormatOptions): string => {
    const d = toValidDate(date);
    if (!d) return '';
    return formatVKDateTime(d, locale, {
      timeZone: userTimezone,
      ...formatOptions,
    });
  };

  const formatDateRange = (
    startDate: DateInput,
    endDate: DateInput,
    formatOptions?: Intl.DateTimeFormatOptions,
  ): string => {
    const s = toValidDate(startDate);
    const e = toValidDate(endDate);
    if (!s || !e) return '';
    return formatVKDateRange(s, e, locale, {
      timeZone: userTimezone,
      ...formatOptions,
    });
  };

  return {
    userTimezone,
    serverTimezone,
    locale,
    project,
    toStartOfDay,
    toEndOfDay,
    toStartOfMonth,
    toEndOfMonth,
    shift,
    toServerTime,
    toDisplayTime,
    getTimezoneOffsetMinutes,
    getOffsetDifferenceMs,
    isSameDate,
    isSameMonth,
    formatDate,
    formatDateTime,
    formatDateRange,
  };
}
