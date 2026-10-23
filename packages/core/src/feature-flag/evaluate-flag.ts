// [MB.05] Rule-based Feature Flag Evaluation Engine (FNV-1a Rollout, Whitelists, Conditions)
// [AP.01] Modern TypeScript semantics: zero any, defensive checks
import { vkAssert } from '../assert/index.js';
import { vkEvaluateRollout } from './evaluate-rollout.js';
import type {
  VKFeatureFlagKey,
  VKFeatureFlagContext,
  VKFeatureFlagDetailedValue,
} from './feature-flag.types.js';

function isDetailedValue(val: unknown): val is VKFeatureFlagDetailedValue {
  return (
    typeof val === 'object' &&
    val !== null &&
    'enabled' in val &&
    typeof (val as { readonly enabled?: unknown }).enabled === 'boolean'
  );
}

/**
 * Evaluates whether a flag is enabled based on its raw/structured value and execution context.
 */
export function evaluateFlagEnabled(
  flagName: VKFeatureFlagKey,
  rawVal: unknown,
  context?: VKFeatureFlagContext,
): boolean {
  // [AP.01] Boundary assertions
  vkAssert.notEmpty(flagName, 'flagName');

  if (rawVal === undefined || rawVal === null) {
    return false;
  }

  if (typeof rawVal === 'boolean') {
    return rawVal;
  }

  if (rawVal === 'true') {
    return true;
  }

  if (rawVal === 'false') {
    return false;
  }

  if (isDetailedValue(rawVal)) {
    if (!rawVal.enabled) {
      return false;
    }

    const rule = rawVal.rule;
    if (!rule) {
      return true;
    }

    // 1. Target User Whitelist
    if (context?.userId && rule.targetUserIds && rule.targetUserIds.length > 0) {
      if (rule.targetUserIds.includes(context.userId)) {
        return true;
      }
    }

    // 2. Target Tenant Whitelist
    if (context?.tenantId && rule.targetTenantIds && rule.targetTenantIds.length > 0) {
      if (rule.targetTenantIds.includes(context.tenantId)) {
        return true;
      }
    }

    // 3. Attribute Matching (Conditions)
    if (rule.conditions) {
      for (const [condKey, condVal] of Object.entries(rule.conditions)) {
        if (!context || context[condKey] !== condVal) {
          return false;
        }
      }
    }

    // 4. Progressive Rollout Percentage
    if (typeof rule.rolloutPercentage === 'number') {
      const partitionKey = context?.userId ?? context?.tenantId;
      if (!partitionKey) {
        return false;
      }
      return vkEvaluateRollout(flagName, rule.rolloutPercentage, String(partitionKey));
    }

    return true;
  }

  return false;
}

/**
 * Extracts the typed value of a flag based on its raw/structured value and context.
 */
export function evaluateFlagValue<T>(
  flagName: VKFeatureFlagKey,
  rawVal: unknown,
  defaultValue: T,
  context?: VKFeatureFlagContext,
): T {
  // [AP.01] Boundary assertions
  vkAssert.notEmpty(flagName, 'flagName');

  if (rawVal === undefined || rawVal === null) {
    return defaultValue;
  }

  if (isDetailedValue(rawVal)) {
    const isEnabled = evaluateFlagEnabled(flagName, rawVal, context);
    if (!isEnabled) {
      return defaultValue;
    }
    if (rawVal.value !== undefined) {
      return rawVal.value as T;
    }
    if (typeof defaultValue === 'boolean') {
      return true as unknown as T;
    }
    return defaultValue;
  }

  if (typeof defaultValue === 'boolean') {
    if (typeof rawVal === 'boolean') {
      return rawVal as unknown as T;
    }
    if (rawVal === 'true') {
      return true as unknown as T;
    }
    if (rawVal === 'false') {
      return false as unknown as T;
    }
    return defaultValue;
  }

  if (typeof defaultValue === typeof rawVal) {
    return rawVal as T;
  }

  return defaultValue;
}
