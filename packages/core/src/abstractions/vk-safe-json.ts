// [CS.06] Safe JSON serialization and deserialization (Item 42)
import { safeJsonStringify } from '../internal/serialization/safe-json-stringify.js';

export interface VKSafeJson {
  /**
   * Serializes a value safely handling BigInt, circular references, Date, and Error instances.
   */
  readonly stringify: (
    value: unknown,
    replacer?: (key: string, value: unknown) => unknown,
    space?: string | number,
  ) => string;

  /**
   * Parses a JSON string into a typed object.
   */
  readonly parse: <T = unknown>(
    json: string,
    reviver?: (key: string, value: unknown) => unknown,
  ) => T;
}

/**
 * Public safe JSON utility (Item 42) promoted from internal serialization.
 * Safely handles BigInt, circular references, and Errors without throwing.
 */
export const vkSafeJson: VKSafeJson = {
  stringify: safeJsonStringify,
  parse: <T = unknown>(
    json: string,
    reviver?: (key: string, value: unknown) => unknown,
  ): T => JSON.parse(json, reviver),
};

/**
 * Direct safe stringify function conforming to VK prefix convention.
 */
export const vkSafeJsonStringify = safeJsonStringify;
