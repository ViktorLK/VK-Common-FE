// [FS-04] Boundary verification creating strongly typed branded GUIDs
// [CS.01] Typed VKResult return
import { isValidGuid } from './is-valid-guid.js';
import { VKError } from '../errors/vk-error.js';
import { VKGuidErrorCodes } from './guids.errors.js';
import { vkOk, vkErr } from '../result/result-constructors.js';
import type { VKResult } from '../result/result.types.js';
import type { VKBrand } from '../types/types.types.js';

/**
 * Validates and parses a raw string into a strongly typed branded GUID.
 * Serves as the sole authoritative gateway for producing branded IDs at boundaries per FS-04.
 */
export function vkParseGuid<T extends VKBrand<string, string> = VKBrand<string, 'VKGuid'>>(
  value: unknown,
): VKResult<T> {
  if (typeof value === 'string' && isValidGuid(value)) {
    return vkOk(value as T);
  }

  return vkErr(
    VKError.validation(
      VKGuidErrorCodes.InvalidFormat,
      `Invalid GUID string format: '${String(value)}'. Expected a valid 36-character UUID/GUID string.`,
    ),
  );
}
