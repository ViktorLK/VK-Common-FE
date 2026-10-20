// [CS.01] Transport-level onion interceptor pipeline execution engine
import type {
  VKHttpInterceptor,
  VKHttpInterceptorContext,
  VKHttpInterceptorNext,
} from '../interceptor/vk-http-interceptor.js';
import type { VKHttpRequest, VKHttpResponse } from '../transport/vk-http-transport.js';

/**
 * Executes a sequence of HTTP interceptors in an onion pipeline.
 * Each interceptor can inspect or modify the request, execute next(),
 * or inspect/modify the resulting VKHttpResponse.
 */
export async function executeInterceptorPipeline(
  interceptors: readonly VKHttpInterceptor[],
  context: VKHttpInterceptorContext,
  finalHandler: VKHttpInterceptorNext,
): Promise<VKHttpResponse> {
  let index = -1;

  async function dispatch(i: number, req: VKHttpRequest): Promise<VKHttpResponse> {
    if (i <= index) {
      throw new Error('next() called multiple times in HTTP interceptor pipeline');
    }
    index = i;

    if (i < interceptors.length) {
      const interceptor = interceptors[i];
      const updatedContext: VKHttpInterceptorContext = {
        request: req,
        attempt: context.attempt,
        metadata: context.metadata,
      };
      return interceptor.intercept(updatedContext, (nextReq) => dispatch(i + 1, nextReq));
    }

    return finalHandler(req);
  }

  return dispatch(0, context.request);
}
