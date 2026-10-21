// [MB.05 / AP.01] Deterministic Rollout Evaluation using FNV-1a 32-bit Hash
import { VKResult } from '../result/vk-result.js';
import { VKError } from '../errors/vk-error.js';

export const VKFeatureFlagErrorCodes = {
  InvalidRollout: 'Core.FeatureFlag.InvalidRollout',
} as const;

export type VKFeatureFlagErrorCode =
  (typeof VKFeatureFlagErrorCodes)[keyof typeof VKFeatureFlagErrorCodes];

/**
 * Deterministically evaluates whether a given contextKey falls into the rolloutPercentage
 * for a feature flag using 32-bit FNV-1a hashing.
 *
 * @param flagKey Unique identifier of the feature flag.
 * @param rolloutPercentage Rollout threshold between 0 and 100.
 * @param contextKey Partitioning key (e.g. userId, tenantId, deviceId).
 */
export function vkEvaluateRollout(
  flagKey: string,
  rolloutPercentage: number,
  contextKey: string,
): boolean {
  if (rolloutPercentage <= 0) {
    return false;
  }
  if (rolloutPercentage >= 100) {
    return true;
  }

  const input = `${flagKey}:${contextKey}`;
  let hash = 0x811c9dc5; // 2166136261 (FNV offset basis)

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // 16777619 (FNV prime)
  }

  const bucket = (hash >>> 0) % 100;
  return bucket < rolloutPercentage;
}

/**
 * Validates inputs and deterministically evaluates rollout percentage, returning a typed VKResult<boolean>.
 */
export function tryEvaluateRollout(
  flagKey: string,
  rolloutPercentage: number,
  contextKey: string,
): VKResult<boolean> {
  if (typeof flagKey !== 'string' || flagKey.trim().length === 0) {
    return VKResult.failure(
      VKError.validation(
        VKFeatureFlagErrorCodes.InvalidRollout,
        'Flag key must be a non-empty string.',
      ),
    );
  }

  if (typeof rolloutPercentage !== 'number' || Number.isNaN(rolloutPercentage)) {
    return VKResult.failure(
      VKError.validation(
        VKFeatureFlagErrorCodes.InvalidRollout,
        'Rollout percentage must be a valid number.',
      ),
    );
  }

  return VKResult.success(vkEvaluateRollout(flagKey, rolloutPercentage, contextKey));
}

export const evaluateRollout = vkEvaluateRollout;
