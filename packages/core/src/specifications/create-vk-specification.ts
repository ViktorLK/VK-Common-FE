// [AP.01] Core VKSpecification implementation and factory functions
// [AP.03] Modern TS conventions: VKSpecification without I prefix
import type { VKSpecification as IVKSpecification, VKSpecificationPredicate } from './specifications.types.js';
import { vkAssert } from '../assert/index.js';
import { VKAndSpecification } from './vk-and-specification.js';
import { VKOrSpecification } from './vk-or-specification.js';
import { VKNotSpecification } from './vk-not-specification.js';

export class VKSpecification<T> implements IVKSpecification<T> {
  constructor(readonly predicate: VKSpecificationPredicate<T>) {
    vkAssert.notNull(predicate, 'predicate');
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

  /**
   * Static factory to create a specification from a predicate.
   */
  static from<T>(predicate: VKSpecificationPredicate<T>): VKSpecification<T> {
    return new VKSpecification(predicate);
  }

  /**
   * Static specification that always evaluates to true.
   */
  static all<T>(): VKSpecification<T> {
    return new VKSpecification<T>(() => true);
  }

  /**
   * Static specification that always evaluates to false.
   */
  static none<T>(): VKSpecification<T> {
    return new VKSpecification<T>(() => false);
  }
}

export function createVKSpecification<T>(predicate: VKSpecificationPredicate<T>): VKSpecification<T> {
  return new VKSpecification(predicate);
}

export function vkAllSpecification<T>(): VKSpecification<T> {
  return VKSpecification.all<T>();
}

export function vkNoneSpecification<T>(): VKSpecification<T> {
  return VKSpecification.none<T>();
}
