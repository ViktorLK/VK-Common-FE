import { describe, it, expect } from 'vitest';
import { DefaultFeatureFlagProvider, createVKFeatureFlagProvider } from './index.js';

describe('DefaultFeatureFlagProvider', () => {
  it('isEnabled returns true for truthy values and false otherwise', () => {
    const provider = new DefaultFeatureFlagProvider({
      'feature.chat': true,
      'feature.ai': 'true',
      'feature.legacy': false,
      'feature.off': 'false',
    });

    expect(provider.isEnabled('feature.chat')).toBe(true);
    expect(provider.isEnabled('feature.ai')).toBe(true);
    expect(provider.isEnabled('feature.legacy')).toBe(false);
    expect(provider.isEnabled('feature.off')).toBe(false);
    expect(provider.isEnabled('feature.unknown')).toBe(false);
  });

  it('getValue returns flag value or default with safe type checking', () => {
    const provider = createVKFeatureFlagProvider({
      maxItems: 50,
      enabled: 'true',
      disabled: 'false',
      invalidNumber: 'not-a-number',
    });

    expect(provider.getValue('maxItems', 10)).toBe(50);
    expect(provider.getValue('missingKey', 100)).toBe(100);
    expect(provider.getValue('enabled', false)).toBe(true);
    expect(provider.getValue('disabled', true)).toBe(false);

    // Mismatched type falls back to default
    expect(provider.getValue('invalidNumber', 42)).toBe(42);
  });
});
