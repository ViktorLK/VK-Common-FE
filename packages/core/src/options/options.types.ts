// [ARCH-13] Typed Configuration and Options Validation Contracts
// [CS.01] Result-based validation port
import type { VKResult } from '../result/result.types.js';

import type { StandardSchemaV1, VKLegacySafeParseSchema } from '../schema/index.js';

export type { StandardSchemaV1, VKLegacySafeParseSchema };

/**
 * Universal schema contract: supports official StandardSchemaV1 or legacy safeParse schemas.
 */
export type VKStandardSchema<TOutput = unknown> =
  | StandardSchemaV1<unknown, TOutput>
  | VKLegacySafeParseSchema<TOutput>;

/**
 * Option validation port (Raw input -> VKResult<T>).
 * Used for fail-fast validation at startup.
 */
export interface VKOptionsValidator<T> {
  readonly validate: (input: unknown) => VKResult<T>;
}

/**
 * Centrally defined options definition model adhering to ARCH-13.
 */
export interface VKOptionsDefinition<TOptions> {
  readonly defaults: Readonly<TOptions>;
  readonly validator?: VKOptionsValidator<TOptions>;
}
