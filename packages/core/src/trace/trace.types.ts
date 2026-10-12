// [FS-11] Observability and Distributed Tracing contracts
import type { VKIdGenerator, VKTimeProvider } from '../abstractions/abstractions.types.js';

export interface VKTraceContext {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentId?: string;
  readonly traceFlags?: string;
}

export interface VKSpan {
  readonly name: string;
  readonly traceId: string;
  readonly spanId: string;
  readonly parentId?: string;
  readonly durationMs: () => number;
  readonly end: () => number;
}

export interface VKTraceProviderOptions {
  readonly idGenerator?: VKIdGenerator;
  readonly timeProvider?: VKTimeProvider;
}

export interface VKTraceProvider {
  readonly createTraceId: () => string;
  /** @deprecated Use `createTraceId` instead */
  readonly getTraceId: () => string;
  readonly createSpanId: () => string;
  readonly startSpan: (name: string, parentContext?: Partial<VKTraceContext>) => VKSpan;
}
