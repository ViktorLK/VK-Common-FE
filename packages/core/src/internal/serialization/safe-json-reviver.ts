// [CS.06] Safe JSON reviver: revives Date, Map, Set, and RegExp
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

/**
 * Reviver function for JSON.parse that reconstructs Dates, Maps, Sets, and RegExps
 * serialized by safeJsonStringify or standard ISO representations.
 */
export function safeJsonReviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (typeof value === 'object' && value !== null && '__vk_type' in value) {
    const tagged = value as { __vk_type: unknown; [key: string]: unknown };
    if (tagged.__vk_type === 'Map' && Array.isArray(tagged.entries)) {
      return new Map(tagged.entries as [unknown, unknown][]);
    }
    if (tagged.__vk_type === 'Set' && Array.isArray(tagged.values)) {
      return new Set(tagged.values);
    }
    if (tagged.__vk_type === 'RegExp' && typeof tagged.source === 'string') {
      const flags = typeof tagged.flags === 'string' ? tagged.flags : undefined;
      return new RegExp(tagged.source, flags);
    }
  }

  return value;
}
