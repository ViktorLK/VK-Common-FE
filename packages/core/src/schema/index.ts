// [MB.02] Explicit barrel export - @vk-blocks/core/schema (Standard Schema V1 Bridge)
export type {
  StandardSchemaV1,
  VKStandardSchemaV1,
  VKLegacySafeParseSchema,
} from './schema.types.js';

export {
  VKSchemaErrorCodes,
} from './schema.errors.js';
export type { VKSchemaErrorCode } from './schema.errors.js';

export {
  isStandardSchema,
  vkIsStandardSchema,
} from './is-standard-schema.js';

export {
  toStandardSchema,
  vkToStandardSchema,
} from './to-standard-schema.js';
