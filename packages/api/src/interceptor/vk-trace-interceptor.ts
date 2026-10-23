// [FS-11] [OR.01] W3C Distributed Tracing Interceptor
import {
  vkAssert,
  createVKTraceProvider,
  createAmbientContext,
  vkFormatTraceparent,
  type VKTraceProvider,
  type VKTraceContext,
} from '@vk-blocks/core';
import type {
  VKHttpInterceptor,
  VKHttpInterceptorContext,
  VKHttpInterceptorNext,
} from './vk-http-interceptor.js';
import { VKHttpHeaders } from '../types/vk-http-constants.js';
import type { VKHttpRequest, VKHttpResponse } from '../transport/vk-http-transport.js';

export interface VKTraceInterceptorOptions {
  /**
   * Injected trace provider. If not supplied, a default trace provider is created.
   */
  readonly traceProvider?: VKTraceProvider;

  /**
   * Whether to inject W3C 'traceparent' header.
   * Defaults to true.
   */
  readonly injectTraceparent?: boolean;

  /**
   * Whether to inject 'x-correlation-id' header with the traceId.
   * Defaults to true.
   */
  readonly injectCorrelationId?: boolean;

  /**
   * Optional hook to retrieve ambient or parent trace context (e.g. from server action or middleware).
   */
  readonly getParentContext?: () => Partial<VKTraceContext> | undefined;
}

/**
 * Creates a distributed tracing interceptor injecting W3C traceparent and correlation IDs (FS-11 / OR.01).
 */
export function createVKTraceInterceptor(options?: VKTraceInterceptorOptions): VKHttpInterceptor {
  // [AP.01] Boundary assertions
  if (options !== undefined) {
    vkAssert.notNull(options, 'options');
  }

  const traceProvider = options?.traceProvider ?? createVKTraceProvider();
  const injectTraceparent = options?.injectTraceparent ?? true;
  const injectCorrelationId = options?.injectCorrelationId ?? true;

  return {
    name: 'VKTraceInterceptor',
    intercept: async (
      context: VKHttpInterceptorContext,
      next: VKHttpInterceptorNext,
    ): Promise<VKHttpResponse> => {
      const headers: Record<string, string> = { ...context.request.headers };
      const ambient = createAmbientContext().currentContext;
      const parentCtx =
        options?.getParentContext?.() ??
        (ambient?.traceId
          ? { traceId: ambient.traceId, correlationId: ambient.correlationId }
          : undefined);
      const span = traceProvider.startSpan(`http:${context.request.method}`, parentCtx);

      // Populate context metadata for downstream interceptors and loggers
      (context.metadata as Record<string, unknown>)['traceId'] = span.traceId;
      (context.metadata as Record<string, unknown>)['spanId'] = span.spanId;

      const hasTraceparent = Object.keys(headers).some(
        (k) => k.toLowerCase() === VKHttpHeaders.TraceParent.toLowerCase(),
      );
      if (injectTraceparent && !hasTraceparent) {
        headers[VKHttpHeaders.TraceParent] = vkFormatTraceparent({
          traceId: span.traceId,
          spanId: span.spanId,
        });
      }

      const hasCorrelationId = Object.keys(headers).some(
        (k) => k.toLowerCase() === VKHttpHeaders.CorrelationId.toLowerCase(),
      );
      if (injectCorrelationId && !hasCorrelationId) {
        headers[VKHttpHeaders.CorrelationId] = span.traceId;
      }

      const hasTenantId = Object.keys(headers).some(
        (k) => k.toLowerCase() === VKHttpHeaders.TenantId.toLowerCase(),
      );
      if (ambient?.tenantId && !hasTenantId) {
        headers[VKHttpHeaders.TenantId] = ambient.tenantId;
      }

      const reqWithTrace: VKHttpRequest = {
        ...context.request,
        headers,
      };

      try {
        const response = await next(reqWithTrace);
        span.end();
        return response;
      } catch (err: unknown) {
        span.end();
        throw err;
      }
    },
  };
}
