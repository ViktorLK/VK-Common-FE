import { describe, it, expectTypeOf } from 'vitest';
import type { VKGuidGenerator, VKGuidOptions, VKGuidType } from './guids.types.js';
import type { VKIdGenerator } from '../abstractions/abstractions.types.js';
import { DefaultGuidGenerator, defaultGuidGenerator, createVKGuidGenerator } from './default-guid-generator.js';

describe('guids type tests', () => {
  it('should satisfy contract types', () => {
    expectTypeOf(defaultGuidGenerator).toMatchTypeOf<VKGuidGenerator>();
    expectTypeOf(defaultGuidGenerator).toMatchTypeOf<VKIdGenerator>();
    expectTypeOf(DefaultGuidGenerator).toBeConstructibleWith({} as VKGuidOptions);
    expectTypeOf(createVKGuidGenerator).toBeCallableWith({ type: 'v7' as VKGuidType });
    expectTypeOf(defaultGuidGenerator.create()).toBeString();
    expectTypeOf(defaultGuidGenerator.generate()).toBeString();
  });
});
