// [FS-05] Server date parsing adhering to isomorphic time model
import { VKResult } from '../result/vk-result.js';
import { VKError } from '../errors/vk-error.js';
import { VKDatetimeConstants } from './datetime.constants.js';
import { VKDatetimeErrorCodes } from './datetime.errors.js';

/**
 * Attempts to parse a server date string into a typed VKResult<Date>.
 * Strictly validates ISO 8601 format with explicit timezone offset per FS-05.
 */
export function tryParseServerDate(dateStr: unknown): VKResult<Date> {
  if (typeof dateStr !== 'string' || !VKDatetimeConstants.IsoDateRegex.test(dateStr.trim())) {
    return VKResult.failure(
      VKError.validation(
        VKDatetimeErrorCodes.InvalidFormat,
        `Invalid server date string format: '${String(dateStr)}'. Expected ISO 8601 with explicit offset (e.g. 'YYYY-MM-DDTHH:mm:ssZ').`,
      ),
    );
  }

  const trimmed = dateStr.trim();
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return VKResult.failure(
      VKError.validation(
        VKDatetimeErrorCodes.InvalidValue,
        `Server date string '${trimmed}' could not be parsed into a valid Date.`,
      ),
    );
  }

  return VKResult.success(date);
}

/**
 * Parses a server date string (ISO 8601 with offset or UTC) safely into a JavaScript Date.
 * Rejects invalid or unparseable date strings with a typed VKError.
 */
export function parseServerDate(dateStr: string): Date {
  const result = tryParseServerDate(dateStr);
  if (result.isFailure) {
    throw result.errors[0];
  }
  return result.value;
}

/**
 * Primary boundary entry point for parsing server date strings to typed VKResult<Date> (Item 41 / FS-05).
 */
export const vkParseServerDate = tryParseServerDate;

