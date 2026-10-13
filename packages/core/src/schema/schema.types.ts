// [BASE-01] Contract-First: StandardSchemaV1 Specification (Zero external runtime dependencies)
// [FS-01] Single Source of Truth wire & boundary schema specification compatible with Zod, Valibot, and ArkType
// @see https://standardschema.dev

/**
 * Standard Schema v1 specification contract.
 * Universal schema interface for TypeScript ecosystems without vendor lock-in.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaV1.Props<Input, Output>;
}

export namespace StandardSchemaV1 {
  export interface Props<Input = unknown, Output = Input> {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
      options?: Record<string, unknown>,
    ) => Result<Output> | Promise<Result<Output>>;
    readonly types?: Types<Input, Output>;
  }

  export type Result<Output> = SuccessResult<Output> | FailureResult;

  export interface SuccessResult<Output> {
    readonly value: Output;
    readonly issues?: undefined;
  }

  export interface FailureResult {
    readonly issues: ReadonlyArray<Issue>;
  }

  export interface Issue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | PathSegment>;
  }

  export interface PathSegment {
    readonly key: PropertyKey;
  }

  export interface Types<Input = unknown, Output = Input> {
    readonly input: Input;
    readonly output: Output;
  }

  export type InferInput<Schema extends StandardSchemaV1> =
    Schema['~standard']['types'] extends Types<infer Input, unknown> ? Input : unknown;

  export type InferOutput<Schema extends StandardSchemaV1> =
    Schema['~standard']['types'] extends Types<unknown, infer Output> ? Output : unknown;
}

/**
 * Standard Schema alias with VK prefix convention per AP.03.
 */
export type VKStandardSchemaV1<Input = unknown, Output = Input> = StandardSchemaV1<Input, Output>;

/**
 * Legacy duck-typed schema contract with safeParse method (Zod-like) for backward compatibility.
 */
export interface VKLegacySafeParseSchema<TOutput = unknown> {
  readonly safeParse: (
    input: unknown,
  ) =>
    | { readonly success: true; readonly data: TOutput }
    | {
        readonly success: false;
        readonly error: {
          readonly flatten?: () => { readonly fieldErrors: Record<string, unknown> };
          readonly message?: string;
        };
      };
}
