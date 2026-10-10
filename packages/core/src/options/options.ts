// [ARCH-13] Centralized Options Resolution & Merging (Args Pattern)
// [CS.01] VKResult-based validation outcome
import { VKResult } from '../result/vk-result.js';
import type { VKOptionsDefinition, VKOptionsValidator } from './options.types.js';

/**
 * Defines a set of options with default values and an optional validator port.
 */
export function vkDefineOptions<TOptions>(
  defaults: Readonly<TOptions>,
  validator?: VKOptionsValidator<TOptions>,
): VKOptionsDefinition<TOptions> {
  return {
    defaults: Object.freeze({ ...defaults }),
    validator,
  };
}

/**
 * Merges invocation-specific args into options defaults and runs validation if defined.
 */
export function vkMergeOptions<TOptions>(
  definition: VKOptionsDefinition<TOptions>,
  args?: Partial<TOptions> | null,
): VKResult<TOptions> {
  const merged = { ...definition.defaults, ...(args ?? {}) } as TOptions;
  if (definition.validator) {
    return definition.validator.validate(merged);
  }
  return VKResult.success(merged);
}
