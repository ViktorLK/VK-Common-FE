import { describe, it, expectTypeOf } from 'vitest';
import type { VKSpecification, VKSpecificationPredicate } from './specifications.types.js';
import { VKSpecification as VKSpecificationClass, createVKSpecification } from './create-vk-specification.js';

describe('specifications type tests', () => {
  it('should preserve type safety and inference', () => {
    interface Item {
      count: number;
    }

    const spec = createVKSpecification<Item>((i) => i.count > 0);
    expectTypeOf(spec).toMatchTypeOf<VKSpecification<Item>>();
    expectTypeOf(spec.isSatisfiedBy).toBeCallableWith({ count: 10 });
    expectTypeOf(spec.and(spec)).toMatchTypeOf<VKSpecification<Item>>();
    expectTypeOf(spec.predicate).toMatchTypeOf<VKSpecificationPredicate<Item>>();
    expectTypeOf(VKSpecificationClass.all<Item>()).toMatchTypeOf<VKSpecification<Item>>();
  });
});
