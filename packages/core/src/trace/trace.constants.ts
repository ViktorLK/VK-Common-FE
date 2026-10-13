// [FS-11] W3C trace constants
export const VKTraceConstants = {
  Version: '00',
  DefaultFlags: '01',
  InvalidTraceId: '00000000000000000000000000000000',
  InvalidSpanId: '0000000000000000',
} as const;

export const TRACEPARENT_REGEX = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;
