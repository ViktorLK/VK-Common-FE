// [FS-11] W3C traceparent header formatting
import { vkAssert } from '../assert/vk-assert.js';
import { VKTraceConstants } from './trace.constants.js';
import type { VKTraceContext } from './trace.types.js';

/**
 * Formats a VKTraceContext into a standard W3C traceparent header string.
 */
export function formatTraceparent(context: VKTraceContext): string {
  const traceId = context.traceId.replace(/-/g, '').toLowerCase();
  const spanId = context.spanId.replace(/-/g, '').toLowerCase();

  vkAssert(traceId.length === 32, 'traceId must be a 32-character hex string');
  vkAssert(traceId !== VKTraceConstants.InvalidTraceId, 'traceId cannot be all zeros');
  vkAssert(spanId.length === 16, 'spanId must be a 16-character hex string');
  vkAssert(spanId !== VKTraceConstants.InvalidSpanId, 'spanId cannot be all zeros');

  const flags = context.traceFlags ?? VKTraceConstants.DefaultFlags;
  return `${VKTraceConstants.Version}-${traceId}-${spanId}-${flags}`;
}

/**
 * Alias conforming to VK prefix convention (Item 33).
 */
export const vkFormatTraceparent = formatTraceparent;

