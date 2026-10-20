// [BASE-01] Contract-First: Specification Pattern Abstraction
// [AP.01] Modern TypeScript Semantics: Generic typed predicate evaluation
// [AP.03] Naming Convention: VKSpecification without I prefix

export type VKSpecificationPredicate<T> = (candidate: T) => boolean;

export interface VKSpecification<T> {
  /**
   * The underlying evaluation predicate for the candidate.
   */
  readonly predicate: VKSpecificationPredicate<T>;

  /**
   * Evaluates if the given candidate satisfies the specification criteria.
   */
  isSatisfiedBy(candidate: T): boolean;

  /**
   * Combines this specification with another via logical AND.
   */
  and(other: VKSpecification<T>): VKSpecification<T>;

  /**
   * Combines this specification with another via logical OR.
   */
  or(other: VKSpecification<T>): VKSpecification<T>;

  /**
   * Inverts this specification via logical NOT.
   */
  not(): VKSpecification<T>;
}
