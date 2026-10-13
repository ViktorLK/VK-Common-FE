import { describe, it, expect } from 'vitest';
import { formatTraceparent } from './format-traceparent.js';
import { VKTraceConstants } from './trace.constants.js';

describe('formatTraceparent', () => {
  it('formats context into standard W3C traceparent string', () => {
    const context = {
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId: '00f067aa0ba902b7',
      traceFlags: '01',
    };

    const header = formatTraceparent(context);
    expect(header).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01');
  });

  it('uses default flags 01 when omitted', () => {
    const context = {
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId: '00f067aa0ba902b7',
    };

    const header = formatTraceparent(context);
    expect(header).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01');
  });

  it('strips dashes from UUID traceId', () => {
    const context = {
      traceId: '4bf92f35-77b3-4da6-a3ce-929d0e0e4736',
      spanId: '00f067aa0ba902b7',
    };

    const header = formatTraceparent(context);
    expect(header).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01');
  });

  it('throws on invalid traceId or spanId', () => {
    expect(() =>
      formatTraceparent({
        traceId: VKTraceConstants.InvalidTraceId,
        spanId: '00f067aa0ba902b7',
      }),
    ).toThrow();

    expect(() =>
      formatTraceparent({
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: VKTraceConstants.InvalidSpanId,
      }),
    ).toThrow();

    expect(() =>
      formatTraceparent({
        traceId: 'short',
        spanId: '00f067aa0ba902b7',
      }),
    ).toThrow();
  });
});
