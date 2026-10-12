// [FS-11] W3C traceparent header parsing
import { VKResult } from '../result/vk-result.js';
import { VKError } from '../errors/vk-error.js';
import { VKTraceConstants, TRACEPARENT_REGEX } from './trace.constants.js';
import { VKTraceErrorCodes } from './trace.errors.js';
import type { VKTraceContext } from './trace.types.js';

/**
 * Parses a standard W3C traceparent header string into a typed VKResult<VKTraceContext>.
 */
export function parseTraceparent(header?: string | null): VKResult<VKTraceContext> {
  if (!header || typeof header !== 'string') {
    return VKResult.failure(
      VKError.validation(VKTraceErrorCodes.InvalidFormat, 'Traceparent header must be a non-empty string'),
    );
  }

  const match = header.trim().match(TRACEPARENT_REGEX);
  if (!match) {
    return VKResult.failure(
      VKError.validation(VKTraceErrorCodes.InvalidFormat, `Invalid traceparent header format: '${header}'`),
    );
  }

  const version = match[1];
  const traceId = match[2];
  const spanId = match[3];
  const traceFlags = match[4];

  if (!version || !traceId || !spanId || !traceFlags) {
    return VKResult.failure(
      VKError.validation(VKTraceErrorCodes.InvalidFormat, 'Failed to extract traceparent components'),
    );
  }

  // W3C spec: version 'ff' is forbidden
  if (version.toLowerCase() === 'ff') {
    return VKResult.failure(
      VKError.validation(VKTraceErrorCodes.InvalidFormat, "Traceparent version 'ff' is invalid"),
    );
  }

  // W3C spec: all-zero IDs are forbidden
  if (traceId === VKTraceConstants.InvalidTraceId || spanId === VKTraceConstants.InvalidSpanId) {
    return VKResult.failure(
      VKError.validation(VKTraceErrorCodes.InvalidId, 'TraceId and SpanId cannot be all zeros'),
    );
  }

  return VKResult.success({
    traceId,
    spanId,
    traceFlags,
  });
}

/**
 * Alias conforming to VK prefix convention (Item 33).
 */
export const vkParseTraceparent = parseTraceparent;

