// [AP.01] Modern TypeScript Semantics: zero any, immutable data
// [FS-04] Strongly Typed Identifiers
// [FS-08] Pagination and Query Contracts

declare const VK_BRAND_SYMBOL: unique symbol;

/**
 * Zero-runtime cost branded (nominal) type helper in TypeScript.
 * Enforces nominal typing via unique symbol while maintaining structural compatibility.
 */
export type VKBrand<T, B extends string | symbol> = T & {
  readonly [VK_BRAND_SYMBOL]: B;
  /**
   * @deprecated Optional marker preserved for backward compatibility with string brand introspection.
   */
  readonly __brand?: B;
};

/**
 * @deprecated Use VKBrand instead per naming convention.
 */
export type Brand<T, B extends string | symbol> = VKBrand<T, B>;

/**
 * Strongly typed domain entity identifiers based on VKBrand adhering to [FS-04].
 * Wire format is a valid GUID/UUID string.
 */
export type VKTenantId = VKBrand<string, 'VKTenantId'>;
export type VKUserId = VKBrand<string, 'VKUserId'>;
export type VKCorrelationId = VKBrand<string, 'VKCorrelationId'>;

/**
 * Represents a non-empty array with at least one element.
 */
export type VKNonEmptyArray<T> = readonly [T, ...T[]];

/**
 * @deprecated Use VKNonEmptyArray instead per naming convention.
 */
export type NonEmptyArray<T> = VKNonEmptyArray<T>;

/**
 * Represents a value or a Promise yielding that value.
 */
export type VKAwaitable<T> = T | PromiseLike<T>;
export type Awaitable<T> = VKAwaitable<T>;

/**
 * Expands object types for better IDE hover and inspection.
 */
export type VKPrettify<T> = { [K in keyof T]: T[K] } & {};
export type Prettify<T> = VKPrettify<T>;

/**
 * Nullable type helper.
 */
export type VKNullable<T> = T | null;
export type Nullable<T> = VKNullable<T>;

/**
 * Optional type helper.
 */
export type VKOptional<T> = T | undefined;
export type Optional<T> = VKOptional<T>;

/**
 * Recursively makes all properties of an object readonly.
 */
export type VKDeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<VKDeepReadonly<R>>
  : T extends (...args: never[]) => unknown
  ? T
  : T extends object
  ? { readonly [K in keyof T]: VKDeepReadonly<T[K]> }
  : T;
export type DeepReadonly<T> = VKDeepReadonly<T>;


/**
 * Standard offset-based paged result envelope adhering to [FS-08].
 */
export interface VKPagedResult<T> {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

/**
 * Standard offset-based page request.
 */
export interface VKPagedRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

/**
 * Standard cursor-based paged result envelope adhering to [FS-08].
 */
export interface VKCursorPagedResult<T, TCursor = string> {
  readonly items: readonly T[];
  /**
   * Primary cursor identifier (retained for backward compatibility).
   */
  readonly cursor: TCursor | null;
  /**
   * Cursor pointing to the next page of items, or null if no further items exist.
   */
  readonly nextCursor?: TCursor | null;
  /**
   * Cursor pointing to the previous page of items, if backward traversal is supported.
   */
  readonly prevCursor?: TCursor | null;
  /**
   * Whether more items are available in the current direction.
   */
  readonly hasMore: boolean;
  /**
   * Optional total count of matching items if supported by the backend store.
   */
  readonly totalCount?: number;
}

/**
 * Standard cursor-based page request adhering to [FS-08].
 */
export interface VKCursorPagedRequest<TCursor = string> {
  readonly cursor?: TCursor | null;
  readonly limit: number;
  readonly direction?: 'forward' | 'backward';
}
