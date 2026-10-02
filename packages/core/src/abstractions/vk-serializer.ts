import { dateReviver } from './_internal/date-reviver.js';

export interface VKSerializerOptions {
  /** ISO date string automatically restored to Date objects. Defaults to true. */
  readonly reviveDates?: boolean;
  /** Custom replacer function */
  readonly replacer?: (key: string, value: unknown) => unknown;
  /** Custom reviver function (run after date reviver if enabled) */
  readonly reviver?: (key: string, value: unknown) => unknown;
}

export interface VKSerializer {
  readonly serialize: <T>(value: T) => string;
  readonly deserialize: <T>(json: string) => T;
}

export const defaultSerializer: VKSerializer = {
  serialize: (value) => JSON.stringify(value),
  deserialize: (json) => JSON.parse(json, dateReviver),
};

export function createVKSerializer(options?: VKSerializerOptions): VKSerializer {
  const reviveDates = options?.reviveDates ?? true;
  const replacer = options?.replacer;
  const customReviver = options?.reviver;

  const reviverFn = (key: string, value: unknown): unknown => {
    let result = value;
    if (reviveDates) {
      result = dateReviver(key, result);
    }
    if (customReviver) {
      result = customReviver(key, result);
    }
    return result;
  };

  return {
    serialize: (value) => JSON.stringify(value, replacer),
    deserialize: (json) => JSON.parse(json, reviverFn),
  };
}
