// [AP.01] Type guard for validating GUID strings
import { VK_GUID_REGEX } from './guids.constants.js';

export function isValidGuid(value: unknown): value is string {
  return typeof value === 'string' && VK_GUID_REGEX.test(value);
}
