// [CS.06] Core Abstractions Contracts

export interface VKIdGenerator {
  readonly generate: () => string;
}

export interface VKClock {
  readonly now: () => Date;
  readonly timestamp: () => number;
}

/**
 * @deprecated Use VKClock instead per naming convention.
 */
export type VKTimeProvider = VKClock;


export interface VKSerializerOptions {
  readonly reviveDates?: boolean;
  readonly reviveCustomTypes?: boolean;
  readonly replacer?: (key: string, value: unknown) => unknown;
  readonly reviver?: (key: string, value: unknown) => unknown;
}

export interface VKSerializer {
  readonly serialize: <T>(value: T) => string;
  readonly deserialize: <T = unknown>(json: string) => T;
}
