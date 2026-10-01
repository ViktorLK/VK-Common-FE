export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

/**
 * Recursively makes all properties of an object readonly.
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends Function
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;
