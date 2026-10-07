// [BASE-01] Contract-First: Guid Generator Abstraction
// [CS.06] Core Abstractions for deterministic/injected ID generation

import type { VKIdGenerator } from '../abstractions/abstractions.types.js';

export type VKGuidType = 'v4' | 'v7';

export interface VKGuidOptions {
  readonly type?: VKGuidType;
  readonly timeSource?: () => number;
}

export interface VKGuidGenerator extends VKIdGenerator {
  /**
   * Creates a new unique GUID using the configured default strategy.
   */
  create(): string;

  /**
   * Creates a cryptographically random RFC 4122 v4 UUID.
   */
  createV4(): string;

  /**
   * Creates a time-ordered RFC 9562 v7 UUID for high-performance index sorting.
   */
  createV7(): string;

  /**
   * Generates a unique ID (implements VKIdGenerator). Alias for create().
   */
  generate(): string;
}
