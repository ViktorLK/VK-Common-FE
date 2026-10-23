// [CS.01] [AP.01] Onion-style transport interceptor pipeline contracts
import type { VKHttpRequest, VKHttpResponse } from '../transport/vk-http-transport.js';

/**
 * Contextual metadata provided to HTTP interceptors during request lifecycle.
 */
export interface VKHttpInterceptorContext {
  readonly request: VKHttpRequest;
  readonly attempt: number;
  readonly metadata: Record<string, unknown>;
}

/**
 * Next function delegate to continue executing the interceptor pipeline.
 */
export type VKHttpInterceptorNext = (request: VKHttpRequest) => Promise<VKHttpResponse>;

/**
 * Transport-level interceptor enabling request transformation, header injection,
 * response inspection, and telemetry hooks before hitting the transport layer.
 */
export interface VKHttpInterceptor {
  readonly name?: string;
  readonly intercept: (
    context: VKHttpInterceptorContext,
    next: VKHttpInterceptorNext,
  ) => Promise<VKHttpResponse>;
}
