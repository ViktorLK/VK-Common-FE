// [MB.02] Explicit typed contracts - Dynamic Timezone Shift Pipeline
// [FS-05] Pure Web standard ECMAScript Intl & Timezone specifications
// [AP.01] Modern TypeScript Semantics: Immutable types, no any

export type DateInput = Date | number | string;

export interface VKTimezoneDateParts {
  readonly year: number;
  readonly month: number; // 0-indexed (0 = Jan, 11 = Dec)
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly timeZone: string;
  readonly offsetMinutes: number;
  readonly offsetFormatted: string; // e.g. "+09:00" or "-04:00"
}

export type DateBoundary = 'startOfDay' | 'endOfDay' | 'startOfMonth' | 'endOfMonth';

export interface VKTimezonePipelineOptions {
  /**
   * User display/browsing timezone (defaults to system local timezone).
   */
  readonly userTimezone?: string;

  /**
   * Enterprise business/server canonical timezone (defaults to 'UTC').
   */
  readonly serverTimezone?: string;

  /**
   * Fallback timezone if invalid IANA identifier is supplied (defaults to 'UTC').
   */
  readonly fallbackTimezone?: string;

  /**
   * Preferred locale for formatting (defaults to 'default').
   */
  readonly locale?: string;
}

export interface VKTimezonePipeline {
  readonly userTimezone: string;
  readonly serverTimezone: string;
  readonly locale: string;

  /**
   * Projects a date into its constituent calendar parts in the specified or user timezone.
   */
  readonly project: (date: DateInput, timeZone?: string) => VKTimezoneDateParts;

  /**
   * Returns exact UTC Date representing the start of day (00:00:00.000) in the specified timezone.
   */
  readonly toStartOfDay: (date: DateInput, timeZone?: string) => Date;

  /**
   * Returns exact UTC Date representing the end of day (23:59:59.999) in the specified timezone.
   */
  readonly toEndOfDay: (date: DateInput, timeZone?: string) => Date;

  /**
   * Returns exact UTC Date representing the start of month in the specified timezone.
   */
  readonly toStartOfMonth: (date: DateInput, timeZone?: string) => Date;

  /**
   * Returns exact UTC Date representing the end of month in the specified timezone.
   */
  readonly toEndOfMonth: (date: DateInput, timeZone?: string) => Date;

  /**
   * Shifts a date between two timezones while preserving or bridging calendar representation.
   */
  readonly shift: (date: DateInput, fromTz: string, toTz: string) => Date;

  /**
   * Normalizes a user-input local date into the equivalent canonical server business date.
   */
  readonly toServerTime: (userLocalDate: DateInput) => Date;

  /**
   * Normalizes a canonical server date into the user's active display timezone.
   */
  readonly toDisplayTime: (serverDate: DateInput) => Date;

  /**
   * Calculates the exact timezone offset in minutes at the given reference point (handles DST).
   */
  readonly getTimezoneOffsetMinutes: (timeZone?: string, date?: DateInput) => number;

  /**
   * Calculates the offset difference in milliseconds between two timezones.
   */
  readonly getOffsetDifferenceMs: (tz1: string, tz2: string, date?: DateInput) => number;

  /**
   * Checks if two dates fall on the same calendar day in the given timezone.
   */
  readonly isSameDate: (d1: DateInput, d2: DateInput, timeZone?: string) => boolean;

  /**
   * Checks if two dates fall in the same calendar month in the given timezone.
   */
  readonly isSameMonth: (d1: DateInput, d2: DateInput, timeZone?: string) => boolean;

  /**
   * Formats a date using pipeline locale and active user timezone.
   */
  readonly formatDate: (date: DateInput, options?: Intl.DateTimeFormatOptions) => string;

  /**
   * Formats a date and time using pipeline locale and active user timezone.
   */
  readonly formatDateTime: (date: DateInput, options?: Intl.DateTimeFormatOptions) => string;

  /**
   * Formats a date range using pipeline locale and active user timezone.
   */
  readonly formatDateRange: (
    startDate: DateInput,
    endDate: DateInput,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
}

export interface VKTimezoneContextValue {
  readonly userTimezone: string;
  readonly serverTimezone: string;
  readonly setUserTimezone: (timeZone: string) => void;
  readonly setServerTimezone: (timeZone: string) => void;
  readonly pipeline: VKTimezonePipeline;
}

export interface VKTimezoneProviderProps {
  /**
   * Controlled user browsing timezone.
   */
  readonly userTimezone?: string;

  /**
   * Controlled enterprise server business timezone.
   */
  readonly serverTimezone?: string;

  /**
   * Initial default user timezone for uncontrolled mode.
   * Defaults to browser local timezone.
   */
  readonly defaultUserTimezone?: string;

  /**
   * Initial default server timezone for uncontrolled mode.
   * Defaults to 'UTC'.
   */
  readonly defaultServerTimezone?: string;

  /**
   * Storage key for persisting user timezone preference.
   * @default 'vk-timezone-user-preference'
   */
  readonly storageKey?: string | null;

  /**
   * Preferred locale for pipeline formatting operations.
   * @default 'default'
   */
  readonly locale?: string;

  readonly children: React.ReactNode;
}
