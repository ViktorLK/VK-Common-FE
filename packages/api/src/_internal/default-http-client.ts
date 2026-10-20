// [AP.05] [CS.01] [CS.03] Industrial DefaultHttpClient implementation with interceptors, metrics, and disposal
import type {
  VKHttpClient,
  VKHttpClientConfig,
  VKRequestOptions,
  VKQueryParamValue,
  VKHttpMetaResult,
  VKHttpRetryOptions,
} from '../client/vk-http-client.js';
import {
  fetchHttpTransport,
  type VKHttpRequest,
  type VKHttpResponse,
} from '../transport/vk-http-transport.js';
import type {
  VKHttpInterceptor,
  VKHttpInterceptorContext,
} from '../interceptor/vk-http-interceptor.js';
import { createVKAuthInterceptor } from '../interceptor/vk-auth-interceptor.js';
import { createVKTraceInterceptor } from '../interceptor/vk-trace-interceptor.js';
import { createVKDeduplicationInterceptor } from '../interceptor/vk-deduplication-interceptor.js';
import { isVKListQuery, vkSerializeListQuery, type VKListQuery } from '../query/vk-list-query.js';
import { executeInterceptorPipeline } from './interceptor-pipeline.js';
import { mapResponseToResult } from './response-mapper.js';
import {
  VKResult,
  VKError,
  VKIdGenerator,
  VKTimeProvider,
  defaultIdGenerator,
  defaultTimeProvider,
  defaultSerializer,
  createVKRetryPolicy,
  VKRetryPolicy,
  combineSignals,
  timeoutSignal,
} from '@vk-blocks/core';

class HttpTransientError extends Error {
  constructor(
    public readonly status: number,
    public readonly response?: VKHttpResponse,
    message?: string,
  ) {
    super(message ?? `HTTP Transient Error: ${status}`);
    this.name = 'HttpTransientError';
  }
}

function serializeQueryParams(
  baseUrl: string,
  path: string,
  params?: Readonly<Record<string, VKQueryParamValue>> | VKListQuery,
): string {
  const relativePath = path.startsWith('/') ? path : `/${path}`;
  const baseAndPath = `${baseUrl}${relativePath}`;

  if (!params) {
    return baseAndPath;
  }

  const normalizedParams = isVKListQuery(params)
    ? vkSerializeListQuery(params)
    : (params as Readonly<Record<string, VKQueryParamValue>>);

  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(normalizedParams)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          queryParams.append(key, String(item));
        }
      }
    } else {
      queryParams.set(key, String(value));
    }
  }

  const queryString = queryParams.toString();
  if (!queryString) {
    return baseAndPath;
  }

  const separator = baseAndPath.includes('?') ? '&' : '?';
  return `${baseAndPath}${separator}${queryString}`;
}

export class DefaultHttpClient implements VKHttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly serializer;
  private readonly logger;
  private readonly transport;
  private readonly traceIdHeaderName: string;
  private readonly idGenerator: VKIdGenerator;
  private readonly timeProvider: VKTimeProvider;
  private readonly retryOptions?: VKHttpRetryOptions;
  private readonly normalizationHook?;
  private readonly retryPolicy: VKRetryPolicy;
  private readonly interceptors: VKHttpInterceptor[] = [];
  private readonly onMetrics?;
  private readonly onFailure?;
  private readonly masterAbortController = new AbortController();
  private isDisposed = false;

  constructor(config: VKHttpClientConfig) {
    this.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.defaultHeaders = { ...config.defaultHeaders };
    this.serializer = config.serializer ?? defaultSerializer;
    this.logger = config.logger;
    this.transport = config.transport ?? fetchHttpTransport;
    this.traceIdHeaderName = config.traceIdHeaderName ?? 'X-Trace-Id';
    this.idGenerator = config.idGenerator ?? defaultIdGenerator;
    this.timeProvider = defaultTimeProvider;
    this.retryOptions = config.retry;
    this.normalizationHook = config.normalizationHook;
    this.onMetrics = config.onMetrics;
    this.onFailure = config.onFailure;
    // [FS-06] Transport layer defaults to 0 retries to avoid dual-retry storms with TanStack Query
    this.retryPolicy = createVKRetryPolicy(this.retryOptions ?? { maxRetries: 0 });

    // [FS-11] Automatic W3C distributed tracing interceptor injection
    if (config.traceProvider || config.enableTracing) {
      this.interceptors.push(
        createVKTraceInterceptor({
          traceProvider: config.traceProvider,
        }),
      );
    }

    // [AP.05] Automatic token provider auth interceptor with single-flight 401 refresh
    if (config.tokenProvider) {
      this.interceptors.push(
        createVKAuthInterceptor({
          tokenProvider: config.tokenProvider,
        }),
      );
    }

    // In-flight request deduplication pool
    if (config.deduplication) {
      const dedupOpts = typeof config.deduplication === 'object' ? config.deduplication : undefined;
      this.interceptors.push(createVKDeduplicationInterceptor(dedupOpts));
    }

    if (config.interceptors) {
      this.interceptors.push(...config.interceptors);
    }
  }

  use(interceptor: VKHttpInterceptor): this {
    this.interceptors.push(interceptor);
    return this;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    this.masterAbortController.abort('HTTP client disposed');
  }

  private async executeCore<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS',
    path: string,
    body: unknown,
    options?: VKRequestOptions,
  ): Promise<{
    result: VKResult<T>;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  }> {
    if (this.isDisposed) {
      return {
        result: VKResult.failure(
          VKError.failure('HTTP.ClientDisposed', 'HTTP client has been disposed.'),
        ),
        status: 0,
        statusText: 'Disposed',
        headers: {},
      };
    }

    const url = serializeQueryParams(this.baseUrl, path, options?.params);

    // [OR.01] [CS.06] Inject Trace ID into request headers if not already provided
    const reqHeaders: Record<string, string> = { ...this.defaultHeaders, ...options?.headers };
    let traceId: string;
    const existingTraceHeader = Object.keys(reqHeaders).find(
      (k) => k.toLowerCase() === this.traceIdHeaderName.toLowerCase(),
    );

    if (existingTraceHeader && reqHeaders[existingTraceHeader]) {
      traceId = reqHeaders[existingTraceHeader];
    } else {
      traceId = this.idGenerator.generate();
      reqHeaders[this.traceIdHeaderName] = traceId;
    }

    const requestTimeout = options?.timeoutMs ?? this.timeoutMs;
    const retryableStatuses =
      this.retryOptions?.retryableStatuses ?? [408, 429, 500, 502, 503, 504];
    const startTime = this.timeProvider.now().getTime();
    let attemptCount = 0;
    let lastResponse: VKHttpResponse | undefined;

    const emitMetrics = (finalStatus: number, isSuccess: boolean) => {
      if (this.onMetrics) {
        try {
          const durationMs = Math.max(0, this.timeProvider.now().getTime() - startTime);
          this.onMetrics({
            method,
            url,
            status: finalStatus,
            durationMs,
            traceId,
            attemptCount,
            isSuccess,
          });
        } catch {
          // Metrics errors must never break request flow
        }
      }
    };

    const notifyFailure = (res: VKResult<T>, finalStatus: number) => {
      if (this.onFailure && res.isFailure) {
        try {
          if (res.error) {
            this.onFailure(res.error, { method, url, status: finalStatus });
          } else if (res.errors) {
            for (const err of res.errors) {
              this.onFailure(err, { method, url, status: finalStatus });
            }
          }
        } catch {
          // Failure hooks must never break request flow
        }
      }
    };

    // [CS.03] Single attempt with timeoutSignal (delegating to native AbortSignal.timeout)
    const makeSingleAttempt = async (
      attemptSignal?: AbortSignal,
    ): Promise<{
      result: VKResult<T>;
      response: VKHttpResponse;
    }> => {
      attemptCount++;

      const signalsToCombine: (AbortSignal | undefined | null)[] = [
        this.masterAbortController.signal,
        options?.signal,
        attemptSignal,
      ];

      if (requestTimeout > 0) {
        signalsToCombine.push(timeoutSignal(requestTimeout));
      }

      const activeSignal: AbortSignal = combineSignals(...signalsToCombine);

      const req: VKHttpRequest = {
        url,
        method,
        headers: reqHeaders,
        body,
        signal: activeSignal,
        onDownloadProgress: options?.onDownloadProgress,
        onUploadProgress: options?.onUploadProgress,
      };

      // [OR.01] Structured context logging with traceId
      this.logger?.debug(`HTTP request starting: ${method} ${url}`, {
        module: 'HTTP',
        action: method,
        url,
        traceId,
        attempt: attemptCount,
      });

      try {
        const context: VKHttpInterceptorContext = {
          request: req,
          attempt: attemptCount,
          metadata: {},
        };

        const response = await executeInterceptorPipeline(
          this.interceptors,
          context,
          (finalReq) => this.transport.send(finalReq),
        );

        lastResponse = response;

        // Check if the response status is a transient retryable status
        if (
          !options?.skipRetry &&
          this.retryPolicy.maxRetries > 0 &&
          response.status >= 400 &&
          retryableStatuses.includes(response.status)
        ) {
          throw new HttpTransientError(
            response.status,
            response,
            `HTTP ${response.status}: transient retryable status.`,
          );
        }

        const result = await mapResponseToResult<T>(
          response,
          this.serializer,
          this.normalizationHook,
          options?.responseType,
        );

        return { result, response };
      } catch (e: unknown) {
        if (e instanceof HttpTransientError) {
          throw e; // Let retryPolicy catch and retry
        }

        const errorObj = e instanceof Error ? e : new Error(String(e));

        this.logger?.error(
          `HTTP request failed: ${method} ${url}`,
          {
            module: 'HTTP',
            action: method,
            url,
            traceId,
            attempt: attemptCount,
          },
          errorObj,
        );

        const isTimeout =
          activeSignal.aborted &&
          (activeSignal.reason?.name === 'TimeoutError' ||
            errorObj.name === 'TimeoutError' ||
            (activeSignal.reason instanceof Error &&
              /timed out/i.test(activeSignal.reason.message)) ||
            /timed out/i.test(errorObj.message));

        if (
          isTimeout ||
          activeSignal.aborted ||
          errorObj.name === 'AbortError' ||
          this.masterAbortController.signal.aborted
        ) {
          // If the caller cancelled the parent signal or client was disposed, do not retry
          if (options?.signal?.aborted || this.masterAbortController.signal.aborted) {
            throw errorObj;
          }

          if (isTimeout) {
            if (
              !options?.skipRetry &&
              this.retryPolicy.maxRetries > 0 &&
              retryableStatuses.includes(408)
            ) {
              throw new HttpTransientError(
                408,
                undefined,
                `Request timed out after ${requestTimeout}ms.`,
              );
            }
            const timeoutErr = new Error(`Request timed out after ${requestTimeout}ms.`);
            timeoutErr.name = 'TimeoutError';
            throw timeoutErr;
          }

          throw errorObj;
        }

        // Network error (e.g. TypeError: Failed to fetch)
        if (!options?.skipRetry && this.retryPolicy.maxRetries > 0) {
          throw errorObj;
        }

        return {
          result: VKResult.failure(
            VKError.failure('HTTP.NetworkError', errorObj.message || 'Network request failed.'),
          ),
          response: {
            status: 0,
            statusText: 'Network Error',
            headers: {},
            text: async () => '',
            json: async () => null,
            blob: async () => new Blob([]),
            arrayBuffer: async () => new ArrayBuffer(0),
          },
        };
      }
    };

    // [FS-06] Execution with or without retry (delegates to single attempt when maxRetries is 0)
    const shouldRetry = !options?.skipRetry && this.retryPolicy.maxRetries > 0;
    if (!shouldRetry) {
      try {
        const outcome = await makeSingleAttempt(options?.signal);
        emitMetrics(outcome.response.status, outcome.result.isSuccess);
        notifyFailure(outcome.result, outcome.response.status);
        return {
          result: outcome.result,
          status: outcome.response.status,
          statusText: outcome.response.statusText,
          headers: outcome.response.headers,
        };
      } catch (e: unknown) {
        const errorObj = e instanceof Error ? e : new Error(String(e));
        const isAbort =
          errorObj.name === 'AbortError' ||
          errorObj.name === 'TimeoutError' ||
          options?.signal?.aborted ||
          this.masterAbortController.signal.aborted ||
          errorObj.message.includes('timed out');
        const errResult = isAbort
          ? VKResult.failure<T>(
              VKError.timeout(
                'HTTP.Timeout',
                errorObj.message || 'The request timed out or was cancelled.',
              ),
            )
          : VKResult.failure<T>(
              VKError.failure('HTTP.NetworkError', errorObj.message || 'Network request failed.'),
            );
        emitMetrics(0, false);
        notifyFailure(errResult, 0);
        return {
          result: errResult,
          status: 0,
          statusText: isAbort ? 'Aborted' : 'Network Error',
          headers: {},
        };
      }
    }

    try {
      const outcome = await this.retryPolicy.execute(
        (signal?: AbortSignal) => makeSingleAttempt(signal),
        options?.signal,
      );
      emitMetrics(outcome.response.status, outcome.result.isSuccess);
      notifyFailure(outcome.result, outcome.response.status);
      return {
        result: outcome.result,
        status: outcome.response.status,
        statusText: outcome.response.statusText,
        headers: outcome.response.headers,
      };
    } catch (e: unknown) {
      if (e instanceof HttpTransientError && e.response) {
        const finalResult = await mapResponseToResult<T>(
          e.response,
          this.serializer,
          this.normalizationHook,
          options?.responseType,
        );
        emitMetrics(e.response.status, finalResult.isSuccess);
        notifyFailure(finalResult, e.response.status);
        return {
          result: finalResult,
          status: e.response.status,
          statusText: e.response.statusText,
          headers: e.response.headers,
        };
      }

      const errorObj = e instanceof Error ? e : new Error(String(e));
      const isAbort =
        errorObj.name === 'AbortError' ||
        options?.signal?.aborted ||
        this.masterAbortController.signal.aborted ||
        errorObj.message.includes('timed out');
      const finalErr = isAbort
        ? VKResult.failure<T>(
            VKError.timeout(
              'HTTP.Timeout',
              errorObj.message || 'The request timed out or was cancelled.',
            ),
          )
        : VKResult.failure<T>(
            VKError.failure(
              'HTTP.MaxRetriesReached',
              errorObj.message || 'Operation failed after maximum retry attempts.',
            ),
          );

      const fallbackStatus = lastResponse?.status ?? 0;
      const fallbackStatusText = lastResponse?.statusText ?? (isAbort ? 'Aborted' : 'Error');
      const fallbackHeaders = lastResponse?.headers ?? {};
      emitMetrics(fallbackStatus, false);
      notifyFailure(finalErr, fallbackStatus);
      return {
        result: finalErr,
        status: fallbackStatus,
        statusText: fallbackStatusText,
        headers: fallbackHeaders,
      };
    }
  }

  async get<T>(path: string, options?: VKRequestOptions): Promise<VKResult<T>> {
    const outcome = await this.executeCore<T>('GET', path, undefined, options);
    return outcome.result;
  }

  async post<T>(path: string, body: unknown, options?: VKRequestOptions): Promise<VKResult<T>> {
    const outcome = await this.executeCore<T>('POST', path, body, options);
    return outcome.result;
  }

  async put<T>(path: string, body: unknown, options?: VKRequestOptions): Promise<VKResult<T>> {
    const outcome = await this.executeCore<T>('PUT', path, body, options);
    return outcome.result;
  }

  async patch<T>(path: string, body: unknown, options?: VKRequestOptions): Promise<VKResult<T>> {
    const outcome = await this.executeCore<T>('PATCH', path, body, options);
    return outcome.result;
  }

  async delete<T>(path: string, options?: VKRequestOptions): Promise<VKResult<T>> {
    const outcome = await this.executeCore<T>('DELETE', path, undefined, options);
    return outcome.result;
  }

  async head<T = void>(path: string, options?: VKRequestOptions): Promise<VKResult<T>> {
    const outcome = await this.executeCore<T>('HEAD', path, undefined, options);
    return outcome.result;
  }

  async options<T = void>(path: string, options?: VKRequestOptions): Promise<VKResult<T>> {
    const outcome = await this.executeCore<T>('OPTIONS', path, undefined, options);
    return outcome.result;
  }

  async requestWithMeta<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS',
    path: string,
    body?: unknown,
    options?: VKRequestOptions,
  ): Promise<VKHttpMetaResult<T>> {
    const outcome = await this.executeCore<T>(method, path, body, options);
    return {
      result: outcome.result,
      status: outcome.status,
      statusText: outcome.statusText,
      headers: outcome.headers,
    };
  }

  async getWithMeta<T>(path: string, options?: VKRequestOptions): Promise<VKHttpMetaResult<T>> {
    return this.requestWithMeta<T>('GET', path, undefined, options);
  }

  async postWithMeta<T>(
    path: string,
    body: unknown,
    options?: VKRequestOptions,
  ): Promise<VKHttpMetaResult<T>> {
    return this.requestWithMeta<T>('POST', path, body, options);
  }

  async putWithMeta<T>(
    path: string,
    body: unknown,
    options?: VKRequestOptions,
  ): Promise<VKHttpMetaResult<T>> {
    return this.requestWithMeta<T>('PUT', path, body, options);
  }

  async patchWithMeta<T>(
    path: string,
    body: unknown,
    options?: VKRequestOptions,
  ): Promise<VKHttpMetaResult<T>> {
    return this.requestWithMeta<T>('PATCH', path, body, options);
  }

  async deleteWithMeta<T>(path: string, options?: VKRequestOptions): Promise<VKHttpMetaResult<T>> {
    return this.requestWithMeta<T>('DELETE', path, undefined, options);
  }
}
