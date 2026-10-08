import { safeJsonStringify, safeJsonReviver } from '../internal/serialization/index.js';

export interface VKSafeJson {
  /**
   * Serializes a value safely handling BigInt, circular references, Date, Map, Set, RegExp, and Error instances.
   */
  readonly stringify: (
    value: unknown,
    replacer?: (key: string, value: unknown) => unknown,
    space?: string | number,
  ) => string;

  /**
   * Parses a JSON string into a typed object with automatic revival of Date, Map, Set, and RegExp.
   */
  readonly parse: <T = unknown>(
    json: string,
    reviver?: (key: string, value: unknown) => unknown,
  ) => T;
}

/**
 * Public safe JSON utility promoted from internal serialization.
 * Safely handles BigInt, circular references, Map, Set, RegExp, and Errors without throwing.
 */
export const vkSafeJson: VKSafeJson = {
  stringify: safeJsonStringify,
  parse: <T = unknown>(
    json: string,
    reviver?: (key: string, value: unknown) => unknown,
  ): T => {
    return JSON.parse(json, (key, value) => {
      let current = safeJsonReviver(key, value);
      if (reviver) {
        current = reviver(key, current);
      }
      return current;
    });
  },
};

/**
 * Direct safe stringify function conforming to VK prefix convention.
 */
export const vkSafeJsonStringify = safeJsonStringify;

/**
 * Direct safe parse function conforming to VK prefix convention.
 */
export const vkSafeJsonParse = vkSafeJson.parse;
