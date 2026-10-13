// [FS-11] [OR.01] Trace user interactions and bind them to Ambient Execution Context
// [ARCH-09] Boundary-Established Context
// [AP.01] Strict TypeScript boundary
import { createAmbientContext } from '../context/create-ambient-context.js';
import type { VKCorrelationId } from '../context/context.types.js';
import { createVKTraceProvider } from './create-vk-trace-provider.js';
import type { VKTraceProvider, VKSpan } from './trace.types.js';

export interface VKTraceInteractionOptions {
  readonly traceProvider?: VKTraceProvider;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Executes a synchronous operation within a newly established interaction trace context.
 * Binds the interaction Span's traceId to the Ambient Execution Context,
 * cascading down to all HTTP and API calls initiated within fn.
 */
export function vkTraceInteraction<T>(
  name: string,
  fn: (span: VKSpan) => T,
  options?: VKTraceInteractionOptions,
): T {
  const provider = options?.traceProvider ?? createVKTraceProvider();
  const ambient = createAmbientContext();
  const currentCtx = ambient.currentContext;

  const span = provider.startSpan(
    `interaction:${name}`,
    currentCtx?.traceId ? { traceId: currentCtx.traceId } : undefined,
  );

  try {
    return ambient.withScope(
      {
        traceId: span.traceId,
        correlationId: (currentCtx?.correlationId ?? span.traceId) as VKCorrelationId,
        slots: {
          ...currentCtx?.slots,
          currentSpanId: span.spanId,
          interactionName: name,
          ...options?.metadata,
        },
      },
      () => fn(span),
    );
  } finally {
    span.end();
  }
}

/**
 * Executes an asynchronous operation within a newly established interaction trace context.
 * Binds the interaction Span's traceId to the Ambient Execution Context,
 * cascading down to all HTTP and API calls initiated within fn.
 */
export async function vkTraceInteractionAsync<T>(
  name: string,
  fn: (span: VKSpan) => Promise<T>,
  options?: VKTraceInteractionOptions,
): Promise<T> {
  const provider = options?.traceProvider ?? createVKTraceProvider();
  const ambient = createAmbientContext();
  const currentCtx = ambient.currentContext;

  const span = provider.startSpan(
    `interaction:${name}`,
    currentCtx?.traceId ? { traceId: currentCtx.traceId } : undefined,
  );

  try {
    return await ambient.withScopeAsync(
      {
        traceId: span.traceId,
        correlationId: (currentCtx?.correlationId ?? span.traceId) as VKCorrelationId,
        slots: {
          ...currentCtx?.slots,
          currentSpanId: span.spanId,
          interactionName: name,
          ...options?.metadata,
        },
      },
      () => fn(span),
    );
  } finally {
    span.end();
  }
}
