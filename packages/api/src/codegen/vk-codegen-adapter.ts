// [FS-01] [BASE-01] [AP.01] Codegen toolchain adapter for Orval / openapi-fetch
import { vkAssert, type VKResult } from '@vk-blocks/core';
import type { VKHttpClient, VKRequestOptions } from '../client/vk-http-client.js';

export interface VKCodegenRequestConfig<TData = unknown> {
  readonly url: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  readonly params?: VKRequestOptions['params'];
  readonly data?: TData;
  readonly headers?: Record<string, string>;
  readonly signal?: AbortSignal;
}

/**
 * Creates an Orval-compatible custom mutator function backed by a VKHttpClient instance (Item 5 / FS-01).
 * Eliminates custom AST code generation parsers in favor of standard OpenAPI code generators.
 *
 * @example
 * ```ts
 * // orval.config.ts -> mutator: { path: './api-mutator.ts', name: 'apiMutator' }
 * export const apiMutator = createVKCodegenMutator(httpClient);
 * ```
 */
export function createVKCodegenMutator(httpClient: VKHttpClient) {
  // [AP.01] Boundary assertions
  vkAssert.notNull(httpClient, 'httpClient');

  return async <TResponse, TData = unknown>(
    config: VKCodegenRequestConfig<TData>,
  ): Promise<VKResult<TResponse>> => {
    vkAssert.notNull(config, 'config');
    const options: VKRequestOptions = {
      headers: config.headers,
      params: config.params,
      signal: config.signal,
    };

    switch (config.method) {
      case 'GET':
        return httpClient.get<TResponse>(config.url, options);
      case 'POST':
        return httpClient.post<TResponse>(config.url, config.data, options);
      case 'PUT':
        return httpClient.put<TResponse>(config.url, config.data, options);
      case 'PATCH':
        return httpClient.patch<TResponse>(config.url, config.data, options);
      case 'DELETE':
        return httpClient.delete<TResponse>(config.url, options);
      case 'HEAD':
        return httpClient.head<TResponse>(config.url, options);
      case 'OPTIONS':
        return httpClient.options<TResponse>(config.url, options);
      default: {
        const _exhaustive: never = config.method;
        return httpClient.get<TResponse>(config.url, options);
      }
    }
  };
}

/**
 * Standard alias for createVKCodegenMutator conforming to VK prefix convention (AP.03).
 */
export const vkCreateCodegenMutator = createVKCodegenMutator;
