// [CS.06] Serializer factory implementation
import { safeJsonStringify, safeJsonReviver } from '../internal/serialization/index.js';
import { dateReviver } from './internal/date-reviver.js';
import type { VKSerializer, VKSerializerOptions } from './abstractions.types.js';

export function createVKSerializer(options?: VKSerializerOptions): VKSerializer {
  const reviveDates = options?.reviveDates ?? true;
  const reviveCustomTypes = options?.reviveCustomTypes ?? true;
  const replacer = options?.replacer;
  const customReviver = options?.reviver;

  const reviverFn = (key: string, value: unknown): unknown => {
    let result = value;
    if (reviveCustomTypes) {
      result = safeJsonReviver(key, result);
    } else if (reviveDates) {
      result = dateReviver(key, result);
    }
    if (customReviver) {
      result = customReviver(key, result);
    }
    return result;
  };

  return {
    serialize: (value) => safeJsonStringify(value, replacer),
    deserialize: (json) => JSON.parse(json, (reviveDates || reviveCustomTypes || customReviver) ? reviverFn : undefined),
  };
}
