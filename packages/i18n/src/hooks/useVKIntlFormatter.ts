// [MB.02] Explicit typed hook - Universal Intl Formatter with Timezone Binding
// [FS-05] Injected timezone & locale awareness for all formatting operations
// [AP.01] Modern TypeScript Semantics: Zero any, fully typed interface

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  toValidDate,
  formatVKDate,
  formatVKDateTime,
  formatVKDateRange,
  formatVKRelativeTime,
  formatVKCurrency,
  formatVKNumber,
  formatVKCompactNumber,
  getVKUserTimeZone,
  type VKDateFormatOptions,
  type VKCompactNumberFormatOptions,
} from '../datetime/index.js';
import {
  createVKTimezonePipeline,
  type DateInput,
  type VKTimezonePipeline,
} from '../timezone/index.js';

export interface UseVKIntlFormatterOptions {
  /**
   * Override locale (defaults to current i18n language or 'default').
   */
  readonly locale?: string;

  /**
   * Override display timezone (defaults to current timezone context or browser local).
   */
  readonly timeZone?: string;

  /**
   * Override canonical server timezone (defaults to 'UTC').
   */
  readonly serverTimezone?: string;
}

export interface VKIntlFormatterReturn {
  readonly locale: string;
  readonly userTimezone: string;
  readonly serverTimezone: string;
  readonly pipeline: VKTimezonePipeline;

  readonly formatDate: (date: DateInput, options?: VKDateFormatOptions) => string;
  readonly formatDateTime: (date: DateInput, options?: VKDateFormatOptions) => string;
  readonly formatDateRange: (
    startDate: DateInput,
    endDate: DateInput,
    options?: VKDateFormatOptions,
  ) => string;
  readonly formatRelativeTime: (
    targetDate: DateInput,
    baseDate?: DateInput,
  ) => string;
  readonly formatCurrency: (
    value: number,
    currency: string,
    options?: Intl.NumberFormatOptions,
  ) => string;
  readonly formatNumber: (
    value: number,
    options?: Intl.NumberFormatOptions,
  ) => string;
  readonly formatCompactNumber: (
    value: number,
    options?: VKCompactNumberFormatOptions,
  ) => string;
}

/**
 * Universal Intl Formatter hook connecting current locale, timezone pipeline, and ECMAScript Intl formatters.
 */
export function useVKIntlFormatter(
  options?: UseVKIntlFormatterOptions,
): VKIntlFormatterReturn {
  // Gracefully retrieve active locale if react-i18next is mounted
  let activeLang = 'default';
  try {
    const { i18n } = useTranslation();
    if (i18n && i18n.language) {
      activeLang = i18n.language;
    }
  } catch {
    // Outside i18n context, fallback to default
  }

  const effectiveLocale = options?.locale ?? activeLang;
  const effectiveUserTz = options?.timeZone ?? getVKUserTimeZone();
  const effectiveServerTz = options?.serverTimezone ?? 'UTC';

  const pipeline = useMemo(() => {
    return createVKTimezonePipeline({
      userTimezone: effectiveUserTz,
      serverTimezone: effectiveServerTz,
      locale: effectiveLocale,
    });
  }, [effectiveUserTz, effectiveServerTz, effectiveLocale]);

  return useMemo<VKIntlFormatterReturn>(() => {
    return {
      locale: effectiveLocale,
      userTimezone: effectiveUserTz,
      serverTimezone: effectiveServerTz,
      pipeline,

      formatDate: (date: DateInput, opt?: VKDateFormatOptions) => {
        const d = toValidDate(date);
        if (!d) return '';
        return formatVKDate(d, effectiveLocale, {
          timeZone: effectiveUserTz,
          ...opt,
        });
      },

      formatDateTime: (date: DateInput, opt?: VKDateFormatOptions) => {
        const d = toValidDate(date);
        if (!d) return '';
        return formatVKDateTime(d, effectiveLocale, {
          timeZone: effectiveUserTz,
          ...opt,
        });
      },

      formatDateRange: (
        startDate: DateInput,
        endDate: DateInput,
        opt?: VKDateFormatOptions,
      ) => {
        const s = toValidDate(startDate);
        const e = toValidDate(endDate);
        if (!s || !e) return '';
        return formatVKDateRange(s, e, effectiveLocale, {
          timeZone: effectiveUserTz,
          ...opt,
        });
      },

      formatRelativeTime: (targetDate: DateInput, baseDate?: DateInput) => {
        return formatVKRelativeTime(targetDate, baseDate, effectiveLocale);
      },

      formatCurrency: (
        value: number,
        currency: string,
        opt?: Intl.NumberFormatOptions,
      ) => {
        return formatVKCurrency(value, currency, effectiveLocale, opt);
      },

      formatNumber: (value: number, opt?: Intl.NumberFormatOptions) => {
        return formatVKNumber(value, effectiveLocale, opt);
      },

      formatCompactNumber: (
        value: number,
        opt?: VKCompactNumberFormatOptions,
      ) => {
        return formatVKCompactNumber(value, effectiveLocale, opt);
      },
    };
  }, [effectiveLocale, effectiveUserTz, effectiveServerTz, pipeline]);
}
