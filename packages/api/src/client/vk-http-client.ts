// [AP.05] [CS.01] Core HTTP client contract and configuration types
import type {
  VKLogger,
  VKResult,
  VKError,
  VKSerializer,
  VKRetryOptions,
  VKIdGenerator,
  VKDisposable,
  VKTraceProvider,
} from '@vk-blocks/core';
import type { VKHttpTransport } from '../transport/vk-http-transport.js';
import type { VKHttpInterceptor } from '../interceptor/vk-http-interceptor.js';
import type { VKDeduplicationOptions } from '../interceptor/vk-deduplication-interceptor.js';
import type { VKHttpProgress } from '../types/vk-http-progress.js';
import type { VKHttpMetric } from '../types/vk-http-metric.js';
import type { VKTokenProvider } from '../types/vk-token-provider.js';
import type { VKListQuery, VKQueryParamValue } from '../query/vk-list-query.js';

export type { VKQueryParamValue } from '../query/vk-list-query.js';

export interface VKHttpRetryOptions extends Partial<VKRetryOptions> {
  readonly retryableStatuses?: readonly number[];
}

export interface VKHttpClientConfig {
  readonly baseUrl: string;
  readonly timeoutMs?: number;
  /**
   * Optional transport-level retry policy.
   * Defaults to 0 retries: transport layer delegates retries to TanStack Query / Application layer
   * to eliminate double-retry storms (FS-06).
   */
  readonly retry?: VKHttpRetryOptions;
  readonly defaultHeaders?: Readonly<Record<string, string>>;
  readonly serializer?: VKSerializer;
  readonly logger?: VKLogger;
  readonly transport?: VKHttpTransport;
  readonly traceIdHeaderName?: string;
  readonly idGenerator?: VKIdGenerator;
  readonly normalizationHook?: (body: unknown) => unknown;
  readonly interceptors?: readonly VKHttpInterceptor[];
  /**
   * Optional in-flight request deduplication configuration or boolean toggle.
   * When enabled, coalesces identical concurrent requests into a shared promise pool.
   */
  readonly deduplication?: boolean | VKDeduplicationOptions;
  readonly onMetrics?: (metric: VKHttpMetric) => void;

  /**
   * Optional failure listener hook called when a request produces a failed VKResult.
   * Enables cross-cutting observability sinks without tight coupling (OR.01).
   */
  readonly onFailure?: (
    error: VKError,
    context: { readonly method: string; readonly url: string; readonly status: number },
  ) => void;

  /**
   * Token provider SPI for automatic Bearer authentication and single-flight 401 refresh (AP.05).
   */
  readonly tokenProvider?: VKTokenProvider;

  /**
   * Trace provider SPI for W3C distributed tracing (FS-11).
   */
  readonly traceProvider?: VKTraceProvider;

  /**
   * Whether to enable automatic W3C distributed tracing interceptor injection (FS-11).
   * Defaults to true if traceProvider is configured.
   */
  readonly enableTracing?: boolean;
}

export interface VKRequestOptions {
  readonly signal?: AbortSignal;
  readonly headers?: Readonly<Record<string, string>>;
  readonly params?: Readonly<Record<string, VKQueryParamValue>> | VKListQuery;
  readonly timeoutMs?: number;
  readonly skipRetry?: boolean;
  readonly responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
  readonly onDownloadProgress?: (progress: VKHttpProgress) => void;
  readonly onUploadProgress?: (progress: VKHttpProgress) => void;
}

/**
 * Rich response container delivering standard Result accompanied by HTTP response metadata.
 */
export interface VKHttpMetaResult<T> {
  readonly result: VKResult<T>;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Readonly<Record<string, string>>;
}

export interface VKHttpClient extends VKDisposable {
  readonly get: <T>(path: string, options?: VKRequestOptions) => Promise<VKResult<T>>;
  readonly post: <T>(path: string, body: unknown, options?: VKRequestOptions) => Promise<VKResult<T>>;
  readonly put: <T>(path: string, body: unknown, options?: VKRequestOptions) => Promise<VKResult<T>>;
  readonly patch: <T>(path: string, body: unknown, options?: VKRequestOptions) => Promise<VKResult<T>>;
  readonly delete: <T>(path: string, options?: VKRequestOptions) => Promise<VKResult<T>>;
  readonly head: <T = void>(path: string, options?: VKRequestOptions) => Promise<VKResult<T>>;
  readonly options: <T = void>(path: string, options?: VKRequestOptions) => Promise<VKResult<T>>;

  /**
   * Executes a request and delivers response metadata (status, headers) alongside the Result.
   */
  readonly requestWithMeta: <T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS',
    path: string,
    body?: unknown,
    options?: VKRequestOptions,
  ) => Promise<VKHttpMetaResult<T>>;

  readonly getWithMeta: <T>(path: string, options?: VKRequestOptions) => Promise<VKHttpMetaResult<T>>;
  readonly postWithMeta: <T>(path: string, body: unknown, options?: VKRequestOptions) => Promise<VKHttpMetaResult<T>>;
  readonly putWithMeta: <T>(path: string, body: unknown, options?: VKRequestOptions) => Promise<VKHttpMetaResult<T>>;
  readonly patchWithMeta: <T>(path: string, body: unknown, options?: VKRequestOptions) => Promise<VKHttpMetaResult<T>>;
  readonly deleteWithMeta: <T>(path: string, options?: VKRequestOptions) => Promise<VKHttpMetaResult<T>>;

  /**
   * Registers an interceptor into the HTTP execution pipeline.
   * Returns this client instance for fluent chaining.
   */
  readonly use: (interceptor: VKHttpInterceptor) => VKHttpClient;

  /**
   * Aborts all pending in-flight requests and cleans up client lifecycle timers.
   */
  readonly dispose: () => void;
}
