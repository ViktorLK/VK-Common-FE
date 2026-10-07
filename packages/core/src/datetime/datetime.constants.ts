// [FS-05] Datetime constants
export const VKDatetimeConstants = {
  // ISO 8601 with required offset (Z or +/-HH:mm)
  IsoDateRegex: /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/,
} as const;
