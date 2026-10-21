import { describe, it, expectTypeOf } from 'vitest';
import type { VKFeatureFlagProvider, VKFeatureFlagKey } from './feature-flag.types.js';

declare module './feature-flag.types.js' {
  interface VKFeatureFlagRegistry {
    'chat.enabled': boolean;
    'theme.mode': string;
  }
}

describe('feature-flag type tests', () => {
  it('VKFeatureFlagKey resolves to keys in VKFeatureFlagRegistry', () => {
    expectTypeOf<'chat.enabled'>().toMatchTypeOf<VKFeatureFlagKey>();
    expectTypeOf<'theme.mode'>().toMatchTypeOf<VKFeatureFlagKey>();
  });

  it('provider accepts registry keys', () => {
    const provider = {} as VKFeatureFlagProvider;
    expectTypeOf(provider.isEnabled('chat.enabled')).toEqualTypeOf<boolean>();
    expectTypeOf(provider.getValue('theme.mode', 'light')).toEqualTypeOf<string>();
  });
});
