// [AP.01] [AP.05] [CS.01] Enterprise typed API client with schema validation and middleware pipeline
import { z } from 'zod';
import {
  VKResult,
  vkAssert,
} from '@vk-blocks/core';
import {
  VKHttpClient,
  VKHttpClientConfig,
  VKRequestOptions,
  createVKHttpClient,
} from '@vk-blocks/http';
import { mapZodErrorToVKErrors } from '../validation/zod-mapper.js';
import {
  VKApiMiddleware,
  VKApiRequestContext,
  executeMiddlewarePipeline,
} from '../middleware/vk-api-middleware.js';
import type { ApiContractEndpoints } from '../generated/api-contract.js';

export { mapZodErrorToVKErrors } from '../validation/zod-mapper.js';

/**
 * Type guard to safely identify a VKHttpClient instance without duck-typing flaws.
 */
export function isVKHttpClient(value: unknown): value is VKHttpClient {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['get'] === 'function' &&
    typeof candidate['post'] === 'function' &&
    typeof candidate['put'] === 'function' &&
    typeof candidate['patch'] === 'function' &&
    typeof candidate['delete'] === 'function'
  );
}

export type VKApiClientInit =
  | VKHttpClient
  | (VKHttpClientConfig & { readonly middlewares?: readonly VKApiMiddleware[] });

export interface VKApiRequestConfig<TInput = unknown, TOutput = unknown> {
  readonly path: string;
  readonly body?: TInput;
  readonly inputSchema?: z.ZodType<TInput>;
  readonly outputSchema?: z.ZodType<TOutput>;
  readonly options?: VKRequestOptions;
}

export interface VKApiGetOptions<TOutput = unknown> {
  readonly schema?: z.ZodType<TOutput>;
  readonly requestOptions?: VKRequestOptions;
}

export interface VKApiMutationOptions<TInput = unknown, TOutput = unknown> {
  readonly inputSchema?: z.ZodType<TInput>;
  readonly outputSchema?: z.ZodType<TOutput>;
  readonly requestOptions?: VKRequestOptions;
}

export type VKEndpointArgs<K extends keyof ApiContractEndpoints> =
  ApiContractEndpoints[K] extends { readonly request: infer TReq }
    ? [
        options: {
          readonly body: TReq;
          readonly inputSchema?: z.ZodType<TReq>;
          readonly outputSchema?: z.ZodType<ApiContractEndpoints[K]['response']>;
          readonly requestOptions?: VKRequestOptions;
        },
      ]
    : [
        options?: {
          readonly outputSchema?: z.ZodType<ApiContractEndpoints[K]['response']>;
          readonly requestOptions?: VKRequestOptions;
        },
      ];

/**
 * Enterprise typed API client providing Zod schema validation,
 * automatic error conversion, middleware pipelines, and RFC 7807 compatibility.
 */
export class VKApiClient {
  private readonly httpClient: VKHttpClient;
  private readonly middlewares: VKApiMiddleware[] = [];

  constructor(clientOrConfig: VKApiClientInit) {
    if (isVKHttpClient(clientOrConfig)) {
      this.httpClient = clientOrConfig;
    } else {
      const { middlewares, ...httpConfig } = clientOrConfig;
      this.httpClient = createVKHttpClient(httpConfig);
      if (middlewares) {
        for (const mw of middlewares) {
          this.middlewares.push(mw);
        }
      }
    }
  }

  /**
   * Static factory to create a VKApiClient from a configuration object.
   */
  static create(
    config: VKHttpClientConfig,
    middlewares?: readonly VKApiMiddleware[],
  ): VKApiClient {
    return new VKApiClient({
      ...config,
      middlewares,
    });
  }

  /**
   * Static factory to wrap an existing VKHttpClient instance.
   */
  static fromHttpClient(
    httpClient: VKHttpClient,
    middlewares?: readonly VKApiMiddleware[],
  ): VKApiClient {
    const client = new VKApiClient(httpClient);
    if (middlewares) {
      for (const mw of middlewares) {
        client.use(mw);
      }
    }
    return client;
  }

  /**
   * Registers a middleware into the client pipeline.
   * Returns `this` for fluent chaining.
   */
  use(middleware: VKApiMiddleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Returns a snapshot of all currently registered middlewares.
   */
  getMiddlewares(): readonly VKApiMiddleware[] {
    return [...this.middlewares];
  }

  /**
   * Executes a validated API request through the client pipeline:
   * 1. Middleware onion execution
   * 2. Pre-flight input schema validation (fails fast if invalid)
   * 3. HTTP transport execution (handled by @vk-blocks/core with RFC 7807 parsing)
   * 4. Post-flight output schema verification
   */
  async request<TOutput, TInput = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    config: VKApiRequestConfig<TInput, TOutput>,
  ): Promise<VKResult<TOutput>> {
    const initialContext: VKApiRequestContext = {
      method,
      path: config.path,
      headers: { ...config.options?.headers },
      params: config.options?.params,
      body: config.body,
      signal: config.options?.signal,
      timeoutMs: config.options?.timeoutMs,
      metadata: {},
    };

    const finalHandler = async (context: VKApiRequestContext): Promise<VKResult<TOutput>> => {
      // 1. Validate input payload if schema is provided
      if (config.inputSchema && context.body !== undefined) {
        const parsedInput = config.inputSchema.safeParse(context.body);
        if (!parsedInput.success) {
          return VKResult.failureMany(mapZodErrorToVKErrors(parsedInput.error));
        }
      }

      const requestOptions: VKRequestOptions = {
        signal: context.signal,
        headers: context.headers,
        params: context.params,
        timeoutMs: context.timeoutMs,
        skipRetry: config.options?.skipRetry,
      };

      // 2. Perform HTTP transport execution
      let httpResult: VKResult<TOutput>;
      switch (context.method) {
        case 'GET':
          httpResult = await this.httpClient.get<TOutput>(context.path, requestOptions);
          break;
        case 'POST':
          httpResult = await this.httpClient.post<TOutput>(context.path, context.body, requestOptions);
          break;
        case 'PUT':
          httpResult = await this.httpClient.put<TOutput>(context.path, context.body, requestOptions);
          break;
        case 'PATCH':
          httpResult = await this.httpClient.patch<TOutput>(context.path, context.body, requestOptions);
          break;
        case 'DELETE':
          httpResult = await this.httpClient.delete<TOutput>(context.path, requestOptions);
          break;
        default: {
          return vkAssert.exhaustive(context.method);
        }
      }

      // If HTTP call failed, propagate error Result directly
      if (httpResult.isFailure) {
        return httpResult;
      }

      // 3. Validate response data if outputSchema is provided
      if (config.outputSchema) {
        const parsedOutput = config.outputSchema.safeParse(httpResult.value);
        if (!parsedOutput.success) {
          return VKResult.failureMany(mapZodErrorToVKErrors(parsedOutput.error));
        }
        return VKResult.success(parsedOutput.data);
      }

      return httpResult;
    };

    return executeMiddlewarePipeline<TOutput>(this.middlewares, initialContext, finalHandler);
  }

  /**
   * Strongly-typed endpoint dispatcher matching generated ApiContractEndpoints.
   * Infers request body requirements and response types at compile-time.
   */
  async invoke<K extends keyof ApiContractEndpoints>(
    endpoint: K,
    ...args: VKEndpointArgs<K>
  ): Promise<VKResult<ApiContractEndpoints[K]['response']>>;
  async invoke<TOutput, TInput = unknown>(
    endpoint: string,
    options?: {
      readonly body?: TInput;
      readonly inputSchema?: z.ZodType<TInput>;
      readonly outputSchema?: z.ZodType<TOutput>;
      readonly requestOptions?: VKRequestOptions;
    },
  ): Promise<VKResult<TOutput>>;
  async invoke(
    endpoint: string,
    options?: {
      readonly body?: unknown;
      readonly inputSchema?: z.ZodType<unknown>;
      readonly outputSchema?: z.ZodType<unknown>;
      readonly requestOptions?: VKRequestOptions;
    },
  ): Promise<VKResult<unknown>> {
    vkAssert.notEmpty(endpoint, 'endpoint');
    const spaceIndex = endpoint.indexOf(' ');
    const methodStr = spaceIndex > -1 ? endpoint.substring(0, spaceIndex).toUpperCase() : 'GET';
    const path = spaceIndex > -1 ? endpoint.substring(spaceIndex + 1).trim() : endpoint.trim();

    const method = methodStr as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

    return this.request(method, {
      path,
      body: options?.body,
      inputSchema: options?.inputSchema,
      outputSchema: options?.outputSchema,
      options: options?.requestOptions,
    });
  }

  async get<TOutput>(path: string, options?: VKApiGetOptions<TOutput>): Promise<VKResult<TOutput>> {
    return this.request<TOutput>('GET', {
      path,
      outputSchema: options?.schema,
      options: options?.requestOptions,
    });
  }

  async post<TOutput, TInput = unknown>(
    path: string,
    body?: TInput,
    options?: VKApiMutationOptions<TInput, TOutput>,
  ): Promise<VKResult<TOutput>> {
    return this.request<TOutput, TInput>('POST', {
      path,
      body,
      inputSchema: options?.inputSchema,
      outputSchema: options?.outputSchema,
      options: options?.requestOptions,
    });
  }

  async put<TOutput, TInput = unknown>(
    path: string,
    body?: TInput,
    options?: VKApiMutationOptions<TInput, TOutput>,
  ): Promise<VKResult<TOutput>> {
    return this.request<TOutput, TInput>('PUT', {
      path,
      body,
      inputSchema: options?.inputSchema,
      outputSchema: options?.outputSchema,
      options: options?.requestOptions,
    });
  }

  async patch<TOutput, TInput = unknown>(
    path: string,
    body?: TInput,
    options?: VKApiMutationOptions<TInput, TOutput>,
  ): Promise<VKResult<TOutput>> {
    return this.request<TOutput, TInput>('PATCH', {
      path,
      body,
      inputSchema: options?.inputSchema,
      outputSchema: options?.outputSchema,
      options: options?.requestOptions,
    });
  }

  async delete<TOutput = void>(path: string, options?: VKApiGetOptions<TOutput>): Promise<VKResult<TOutput>> {
    return this.request<TOutput>('DELETE', {
      path,
      outputSchema: options?.schema,
      options: options?.requestOptions,
    });
  }
}
