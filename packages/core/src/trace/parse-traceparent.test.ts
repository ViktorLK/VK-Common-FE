import { describe, it, expect } from 'vitest';
import { parseTraceparent } from './parse-traceparent.js';
import { VKTraceErrorCodes } from './trace.errors.js';

describe('parseTraceparent', () => {
  it('parses valid W3C traceparent header into VKResult', () => {
    const header = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
    const result = parseTraceparent(header);

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toEqual({
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '00f067aa0ba902b7',
        traceFlags: '01',
      });
    }
  });

  it('fails with InvalidFormat on null or non-string inputs', () => {
    const res1 = parseTraceparent(null);
    expect(res1.isFailure).toBe(true);
    if (res1.isFailure) {
      expect(res1.errors[0]?.code).toBe(VKTraceErrorCodes.InvalidFormat);
    }

    const res2 = parseTraceparent('');
    expect(res2.isFailure).toBe(true);

    const res3 = parseTraceparent('invalid-header');
    expect(res3.isFailure).toBe(true);
    if (res3.isFailure) {
      expect(res3.errors[0]?.code).toBe(VKTraceErrorCodes.InvalidFormat);
    }
  });

  it('fails with InvalidFormat on version ff', () => {
    const header = 'ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
    const result = parseTraceparent(header);

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.errors[0]?.code).toBe(VKTraceErrorCodes.InvalidFormat);
    }
  });

  it('fails with InvalidId on all-zero traceId or spanId', () => {
    const zeroTrace = '00-00000000000000000000000000000000-00f067aa0ba902b7-01';
    const res1 = parseTraceparent(zeroTrace);
    expect(res1.isFailure).toBe(true);
    if (res1.isFailure) {
      expect(res1.errors[0]?.code).toBe(VKTraceErrorCodes.InvalidId);
    }

    const zeroSpan = '00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01';
    const res2 = parseTraceparent(zeroSpan);
    expect(res2.isFailure).toBe(true);
    if (res2.isFailure) {
      expect(res2.errors[0]?.code).toBe(VKTraceErrorCodes.InvalidId);
    }
  });
});
