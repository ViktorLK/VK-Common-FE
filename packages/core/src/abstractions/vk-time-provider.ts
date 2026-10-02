import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export interface VKTimeProvider {
  readonly now: () => Date;
  readonly timestamp: () => number;
  readonly utcNow: () => Date;
  readonly toISO: (date: Date) => string;
  readonly fromISO: (iso: string) => Date;
  readonly diffMs: (a: Date, b: Date) => number;
  readonly parseServerDate: (dateStr: string, format?: string) => Date;
  readonly formatForDisplay: (date: Date, formatStr?: string) => string;
}

export const defaultTimeProvider: VKTimeProvider = {
  now: () => new Date(),
  timestamp: () => Date.now(),
  utcNow: () => dayjs.utc().toDate(),
  toISO: (date) => dayjs(date).utc().toISOString(),
  fromISO: (iso) => dayjs.utc(iso).toDate(),
  diffMs: (a, b) => dayjs(a).diff(dayjs(b)),
  parseServerDate: (dateStr, format) => {
    if (format) {
      return dayjs.utc(dateStr, format).toDate();
    }
    return dayjs.utc(dateStr).toDate();
  },
  formatForDisplay: (date, formatStr = 'YYYY-MM-DD HH:mm:ss') => {
    return dayjs(date).format(formatStr);
  },
};
