import { describe, it, expect } from 'vitest';
import { createVKTraceProvider } from './create-vk-trace-provider.js';

describe('createVKTraceProvider', () => {
  it('generates IDs and measures span duration', () => {
    let mockTime = 1000;
    const provider = createVKTraceProvider({
      timeProvider: {
        now: () => new Date(mockTime),
        timestamp: () => mockTime,
      },
    });

    const traceId = provider.createTraceId();
    const spanId = provider.createSpanId();

    expect(traceId).toHaveLength(32);
    expect(spanId).toHaveLength(16);
    expect(provider.getTraceId()).toHaveLength(32);

    const span = provider.startSpan('render');
    expect(span.name).toBe('render');
    expect(span.traceId).toHaveLength(32);
    expect(span.spanId).toHaveLength(16);
    expect(span.parentId).toBeUndefined();

    mockTime += 50;
    expect(span.durationMs()).toBe(50);

    mockTime += 20;
    const duration = span.end();
    expect(duration).toBe(70);

    mockTime += 30;
    // After end(), durationMs returns finalDuration
    expect(span.durationMs()).toBe(70);
  });

  it('inherits parent context when starting span', () => {
    const provider = createVKTraceProvider();
    const parentSpan = provider.startSpan('parent');

    const childSpan = provider.startSpan('child', {
      traceId: parentSpan.traceId,
      spanId: parentSpan.spanId,
    });

    expect(childSpan.traceId).toBe(parentSpan.traceId);
    expect(childSpan.parentId).toBe(parentSpan.spanId);
    expect(childSpan.spanId).not.toBe(parentSpan.spanId);
  });

  it('supports legacy idGenerator passed directly as argument', () => {
    const customGen = { generate: () => '11112222333344445555666677778888' };
    const provider = createVKTraceProvider(customGen);

    expect(provider.createTraceId()).toBe('11112222333344445555666677778888');
  });
});
