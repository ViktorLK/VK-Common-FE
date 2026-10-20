// [AP.01] Composite specification performing logical NOT
import type { VKSpecification, VKSpecificationPredicate } from './specifications.types.js';
import { vkAssert } from '../assert/index.js';

export class VKNotSpecification<T> implements VKSpecification<T> {
  readonly predicate: VKSpecificationPredicate<T>;

  constructor(private readonly inner: VKSpecification<T>) {
    vkAssert.notNull(inner, 'inner');
    this.predicate = (candidate: T) => !this.inner.isSatisfiedBy(candidate);
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.predicate(candidate);
  }

  and(other: VKSpecification<T>): VKSpecification<T> {
    return new VKAndSpecification(this, other);
  }

  or(other: VKSpecification<T>): VKSpecification<T> {
    return new VKOrSpecification(this, other);
  }

  not(): VKSpecification<T> {
    return this.inner;
  }
}

import { VKAndSpecification } from './vk-and-specification.js';
import { VKOrSpecification } from './vk-or-specification.js';
