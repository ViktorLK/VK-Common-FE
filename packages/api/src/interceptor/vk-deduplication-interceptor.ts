// [CS.03] [AP.01] In-flight Request Deduplication Interceptor (Canonical Hash Pool)
import { vkAssert } from '@vk-blocks/core';
import type { VKHttpRequest, VKHttpResponse } from '../transport/vk-http-transport.js';
import type {
  VKHttpInterceptor,
  VKHttpInterceptorContext,
  VKHttpInterceptorNext,
} from './vk-http-interceptor.js';

export interface VKDeduplicationOptions {
  /**
   * HTTP methods that should participate in in-flight deduplication.
   * Defaults to ['GET', 'HEAD'].
   */
  readonly deduplicableMethods?: readonly string[];
  /**
   * Custom key generator given request.
   */
  readonly keyGenerator?: (request: VKHttpRequest) => string;
  /**
   * Filter predicate determining if a specific request should be deduplicated.
   */
  readonly shouldDeduplicate?: (request: VKHttpRequest) => boolean;
}

/**
 * Computes a deterministic canonical hash signature for an HTTP request.
 * Sorts query parameters and serializes body to ensure identical requests yield the same hash.
 */
export function computeCanonicalRequestHash(request: VKHttpRequest): string {
  vkAssert.notNull(request, 'request');

  const method = request.method.toUpperCase();

  let canonicalUrl = request.url;
  try {
    const urlObj = new URL(request.url, 'http://localhost');
    const sortedParams = Array.from(urlObj.searchParams.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const search = new URLSearchParams(sortedParams).toString();
    canonicalUrl = `${urlObj.origin !== 'http://localhost' ? urlObj.origin : ''}${urlObj.pathname}${search ? `?${search}` : ''}`;
  } catch {
    // Retain original url if not standard URL
  }

  let bodyHash = '';
  if (request.body !== undefined && request.body !== null) {
    if (typeof request.body === 'string') {
      bodyHash = request.body;
    } else {
      try {
        bodyHash = JSON.stringify(request.body);
      } catch {
        bodyHash = String(request.body);
      }
    }
  }

  return `${method}:${canonicalUrl}:${bodyHash}`;
}

/**
 * Clones a VKHttpResponse into an in-memory buffered response
 * so multiple concurrent subscribers can safely consume body streams independently.
 */
async function bufferHttpResponse(response: VKHttpResponse): Promise<VKHttpResponse> {
  const status = response.status;
  const statusText = response.statusText;
  const headers = { ...response.headers };
  const rawResponse = response.rawResponse;

  let buffer: ArrayBuffer | null = null;
  let textData: string | null = null;

  const getArrayBuffer = async (): Promise<ArrayBuffer> => {
    if (buffer !== null) return buffer;
    if (textData !== null) {
      buffer = new TextEncoder().encode(textData).buffer;
      return buffer;
    }
    buffer = await response.arrayBuffer();
    return buffer;
  };

  const getText = async (): Promise<string> => {
    if (textData !== null) return textData;
    if (buffer !== null) {
      textData = new TextDecoder().decode(buffer);
      return textData;
    }
    textData = await response.text();
    return textData;
  };

  return {
    status,
    statusText,
    headers,
    text: getText,
    json: async () => {
      const txt = await getText();
      return txt.trim() ? JSON.parse(txt) : null;
    },
    blob: async () => {
      const buf = await getArrayBuffer();
      return new Blob([buf]);
    },
    arrayBuffer: getArrayBuffer,
    rawResponse,
  };
}

/**
 * Creates an in-flight request deduplication interceptor (Promise Sharing Pool).
 * Coalesces identical concurrent HTTP requests into a single network execution,
 * preventing duplicate traffic spikes (Thundering Herd) and duplicate submissions.
 */
export function createVKDeduplicationInterceptor(
  options?: VKDeduplicationOptions,
): VKHttpInterceptor {
  const allowedMethods = new Set(
    (options?.deduplicableMethods ?? ['GET', 'HEAD']).map((m) => m.toUpperCase()),
  );
  const inFlightPool = new Map<string, Promise<VKHttpResponse>>();

  return {
    name: 'VKDeduplicationInterceptor',
    intercept: async (
      context: VKHttpInterceptorContext,
      next: VKHttpInterceptorNext,
    ): Promise<VKHttpResponse> => {
      const { request } = context;

      // Check method eligibility
      if (!allowedMethods.has(request.method.toUpperCase())) {
        return next(request);
      }

      // Check header opt-out: x-skip-dedup
      const hasSkipHeader = Object.entries(request.headers).some(
        ([key, val]) => key.toLowerCase() === 'x-skip-dedup' && val === 'true',
      );
      if (hasSkipHeader) {
        return next(request);
      }

      // Check user filter
      if (options?.shouldDeduplicate && !options.shouldDeduplicate(request)) {
        return next(request);
      }

      // Compute canonical signature
      const key = options?.keyGenerator
        ? options.keyGenerator(request)
        : computeCanonicalRequestHash(request);

      const existingPromise = inFlightPool.get(key);
      if (existingPromise) {
        return existingPromise;
      }

      const requestPromise = (async () => {
        try {
          const rawResponse = await next(request);
          return await bufferHttpResponse(rawResponse);
        } finally {
          inFlightPool.delete(key);
        }
      })();

      inFlightPool.set(key, requestPromise);
      return requestPromise;
    },
  };
}
