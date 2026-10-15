// [AP.01] Composite specification performing logical AND
import type { VKSpecification, VKSpecificationPredicate } from './specifications.types.js';
import { vkAssert } from '../assert/index.js';

export class VKAndSpecification<T> implements VKSpecification<T> {
  readonly predicate: VKSpecificationPredicate<T>;

  constructor(
    private readonly left: VKSpecification<T>,
    private readonly right: VKSpecification<T>,
  ) {
    vkAssert.notNull(left, 'left');
    vkAssert.notNull(right, 'right');
    this.predicate = (candidate: T) => this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
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
    return new VKNotSpecification(this);
  }
}

// Lazy reference resolution for circular composite relationships
import { VKOrSpecification } from './vk-or-specification.js';
import { VKNotSpecification } from './vk-not-specification.js';
