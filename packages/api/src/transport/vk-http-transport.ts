// [CS.03] [AP.01] Web Standard Request/Response and Tauri Native HTTP Transport
import { vkAssert } from '@vk-blocks/core';
import type { VKHttpProgress } from '../types/vk-http-progress.js';

export interface VKHttpRequest {
  readonly url: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  readonly headers: Record<string, string>;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  readonly onDownloadProgress?: (progress: VKHttpProgress) => void;
  readonly onUploadProgress?: (progress: VKHttpProgress) => void;
}

export interface VKHttpResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly text: () => Promise<string>;
  readonly json: () => Promise<unknown>;
  readonly blob: () => Promise<Blob>;
  readonly arrayBuffer: () => Promise<ArrayBuffer>;
  /**
   * Reference to the underlying native Response object (e.g. Web standard Response or Tauri response).
   */
  readonly rawResponse?: unknown;
}

export interface VKHttpTransport {
  readonly send: (request: VKHttpRequest) => Promise<VKHttpResponse>;
}

export interface VKFetchTransportOptions {
  /**
   * Custom fetch function (e.g. custom agent fetch, Node undici, or mock fetch).
   */
  readonly customFetch?: typeof fetch;
}

export interface VKTauriTransportOptions {
  /**
   * Explicit Tauri fetch function instance from `@tauri-apps/plugin-http`.
   */
  readonly tauriFetch?: typeof fetch;
}

/**
 * Adapts a Web standard Response instance into a VKHttpResponse container (Item 1).
 */
export function vkCreateResponseFromWeb(
  response: Response,
  request?: VKHttpRequest,
): VKHttpResponse {
  vkAssert.notNull(response, 'response');

  const responseHeaders: Record<string, string> = {};
  if (response.headers && typeof response.headers.forEach === 'function') {
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
  }

  let cachedText: string | undefined;
  let cachedBlob: Blob | undefined;
  let cachedArrayBuffer: ArrayBuffer | undefined;

  const ensureText = async (): Promise<string> => {
    if (cachedText !== undefined) {
      return cachedText;
    }
    if (cachedArrayBuffer !== undefined) {
      cachedText = new TextDecoder().decode(cachedArrayBuffer);
      return cachedText;
    }
    if (typeof response.text === 'function') {
      cachedText = await response.text();
      return cachedText;
    }
    return '';
  };

  const ensureArrayBuffer = async (): Promise<ArrayBuffer> => {
    if (cachedArrayBuffer !== undefined) {
      return cachedArrayBuffer;
    }
    if (typeof response.arrayBuffer === 'function') {
      cachedArrayBuffer = await response.arrayBuffer();
      return cachedArrayBuffer;
    }
    const txt = await ensureText();
    cachedArrayBuffer = new TextEncoder().encode(txt).buffer;
    return cachedArrayBuffer;
  };

  const ensureBlob = async (): Promise<Blob> => {
    if (cachedBlob !== undefined) {
      return cachedBlob;
    }
    if (
      typeof response.blob === 'function' &&
      cachedText === undefined &&
      cachedArrayBuffer === undefined
    ) {
      cachedBlob = await response.blob();
      return cachedBlob;
    }
    const buf = await ensureArrayBuffer();
    cachedBlob = new Blob([buf]);
    return cachedBlob;
  };

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    text: ensureText,
    json: async () => {
      const txt = await ensureText();
      return txt.trim() ? JSON.parse(txt) : null;
    },
    blob: ensureBlob,
    arrayBuffer: ensureArrayBuffer,
    rawResponse: response,
  };
}

/**
 * Creates an HTTP transport wrapping Web standard fetch or an injected fetch instance (Item 1 / CS.03).
 */
export function createVKFetchTransport(options?: VKFetchTransportOptions): VKHttpTransport {
  return {
    send: async (request: VKHttpRequest): Promise<VKHttpResponse> => {
      const activeFetch = vkAssert.notNull(
        options?.customFetch ?? (typeof fetch !== 'undefined' ? fetch : undefined),
        'fetch implementation is not available in the current runtime',
      );

      const headersRecord: Record<string, string> = { ...request.headers };

      const fetchOptions: RequestInit = {
        method: request.method,
        signal: request.signal,
      };

      if (request.body !== undefined && request.body !== null) {
        const isString = typeof request.body === 'string';
        const isFormData = typeof FormData !== 'undefined' && request.body instanceof FormData;
        const isBlob = typeof Blob !== 'undefined' && request.body instanceof Blob;
        const isArrayBuffer =
          typeof ArrayBuffer !== 'undefined' &&
          (request.body instanceof ArrayBuffer || ArrayBuffer.isView(request.body));
        const isURLSearchParams =
          typeof URLSearchParams !== 'undefined' && request.body instanceof URLSearchParams;

        if (isString || isFormData || isBlob || isArrayBuffer || isURLSearchParams) {
          fetchOptions.body = request.body as BodyInit;
        } else {
          const hasContentType = Object.keys(headersRecord).some(
            (k) => k.toLowerCase() === 'content-type',
          );
          if (!hasContentType) {
            headersRecord['Content-Type'] = 'application/json';
          }
          fetchOptions.body = JSON.stringify(request.body);
        }
      }

      fetchOptions.headers = headersRecord;

      const response = await activeFetch(request.url, fetchOptions);

      // Handle stream download progress if configured
      if (
        request.onDownloadProgress &&
        response.body &&
        typeof response.body.getReader === 'function'
      ) {
        const reader = response.body.getReader();
        const contentLengthHeader =
          response.headers.get?.('content-length') ??
          (response.headers as unknown as Record<string, string>)?.['content-length'];
        const total = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
        let loaded = 0;
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.length;
            const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
            request.onDownloadProgress({ loaded, total, percent });
          }
        }

        const allChunks = new Uint8Array(loaded);
        let position = 0;
        for (const chunk of chunks) {
          allChunks.set(chunk, position);
          position += chunk.length;
        }

        const responseHeaders: Record<string, string> = {};
        if (response.headers && typeof response.headers.forEach === 'function') {
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });
        }

        return {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          text: async () => new TextDecoder().decode(allChunks.buffer),
          json: async () => {
            const txt = new TextDecoder().decode(allChunks.buffer);
            return txt.trim() ? JSON.parse(txt) : null;
          },
          blob: async () => new Blob([allChunks.buffer]),
          arrayBuffer: async () => allChunks.buffer,
          rawResponse: response,
        };
      }

      return vkCreateResponseFromWeb(response, request);
    },
  };
}

/**
 * Creates an HTTP transport specialized for Tauri desktop runtime (Item 1).
 * Directly injects Tauri's native `@tauri-apps/plugin-http` fetch or detects global ambient Tauri instance.
 */
export function createVKTauriHttpTransport(options?: VKTauriTransportOptions): VKHttpTransport {
  if (options?.tauriFetch) {
    return createVKFetchTransport({ customFetch: options.tauriFetch });
  }

  // Detect ambient Tauri global fetch if present in desktop webview
  const globalObj =
    typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : {};
  const tauriObj = globalObj['__TAURI__'] as Record<string, unknown> | undefined;
  const tauriHttp = tauriObj?.['http'] as { fetch?: typeof fetch } | undefined;

  const tauriFetch = tauriHttp?.fetch ?? (typeof fetch !== 'undefined' ? fetch : undefined);
  return createVKFetchTransport({ customFetch: tauriFetch });
}

/**
 * Electron IPC Renderer interface contract.
 */
export interface VKElectronIpcRenderer {
  readonly invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
}

export interface VKElectronTransportOptions {
  /**
   * Explicit electron ipcRenderer instance.
   */
  readonly ipcRenderer?: VKElectronIpcRenderer;
  /**
   * IPC channel name to send request. Defaults to 'vk:http-request'.
   */
  readonly channelName?: string;
  /**
   * Fallback transport if IPC is unavailable. Defaults to fetchHttpTransport.
   */
  readonly fallbackTransport?: VKHttpTransport;
}

/**
 * Creates an HTTP transport specialized for Electron desktop runtime (ARCH-02).
 * Delegates HTTP requests across the IPC boundary to bypass CORS and leverage native desktop network stack.
 */
export function createVKElectronHttpTransport(options?: VKElectronTransportOptions): VKHttpTransport {
  const globalObj =
    typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : {};
  const electronObj = globalObj['electron'] as { ipcRenderer?: VKElectronIpcRenderer } | undefined;
  const ipc =
    options?.ipcRenderer ??
    electronObj?.ipcRenderer ??
    (globalObj['ipcRenderer'] as VKElectronIpcRenderer | undefined);

  if (!ipc) {
    return options?.fallbackTransport ?? fetchHttpTransport;
  }

  const channel = options?.channelName ?? 'vk:http-request';

  return {
    send: async (request: VKHttpRequest): Promise<VKHttpResponse> => {
      const payload = {
        url: request.url,
        method: request.method,
        headers: request.headers,
        body: request.body,
      };

      try {
        const responseData = (await ipc.invoke(channel, payload)) as {
          status?: number;
          statusText?: string;
          headers?: Record<string, string>;
          data?: unknown;
          bodyText?: string;
        } | null;

        const status = responseData?.status ?? 200;
        const statusText = responseData?.statusText ?? 'OK';
        const headers = responseData?.headers ?? {};
        const textContent =
          responseData?.bodyText ??
          (responseData?.data !== undefined ? JSON.stringify(responseData.data) : '');

        return {
          status,
          statusText,
          headers,
          text: async () => textContent,
          json: async () => (responseData?.data !== undefined ? responseData.data : JSON.parse(textContent)),
          blob: async () => new Blob([textContent]),
          arrayBuffer: async () => new TextEncoder().encode(textContent).buffer,
          rawResponse: responseData,
        };
      } catch (err: unknown) {
        if (options?.fallbackTransport) {
          return options.fallbackTransport.send(request);
        }
        throw err;
      }
    },
  };
}

export type VKMemoryRouteHandler = (
  request: VKHttpRequest,
) =>
  | Promise<VKHttpResponse | { status?: number; statusText?: string; headers?: Record<string, string>; data?: unknown }>
  | VKHttpResponse
  | { status?: number; statusText?: string; headers?: Record<string, string>; data?: unknown };

export interface VKMemoryTransportOptions {
  /**
   * Route handlers mapped by method + path (e.g. 'GET /api/users') or path alone.
   */
  readonly routes?: Record<string, VKMemoryRouteHandler>;
  /**
   * Catch-all fallback handler for unmatched requests.
   */
  readonly fallbackHandler?: VKMemoryRouteHandler;
}

/**
 * Creates an in-memory HTTP transport (ARCH-05 Fallback tier).
 * Completely decouples testing, mock routes, and SSR from physical network sockets.
 */
export function createVKMemoryHttpTransport(options: VKMemoryTransportOptions = {}): VKHttpTransport {
  return {
    send: async (request: VKHttpRequest): Promise<VKHttpResponse> => {
      const fullKey = `${request.method} ${request.url}`;
      let handler = options.routes?.[fullKey] ?? options.routes?.[request.url];

      if (!handler && options.routes) {
        // Try pathname match
        try {
          const parsed = new URL(request.url, 'http://localhost');
          const pathKey = `${request.method} ${parsed.pathname}`;
          handler = options.routes[pathKey] ?? options.routes[parsed.pathname];
        } catch {
          // Non-URL path string
        }
      }

      handler = handler ?? options.fallbackHandler;

      if (!handler) {
        return {
          status: 404,
          statusText: 'Not Found',
          headers: {},
          text: async () => 'Route not found in MemoryHttpTransport',
          json: async () => ({ error: 'Not Found', url: request.url }),
          blob: async () => new Blob(['Route not found']),
          arrayBuffer: async () => new ArrayBuffer(0),
          rawResponse: null,
        };
      }

      const result = await handler(request);

      if ('text' in result && typeof result.text === 'function') {
        return result as VKHttpResponse;
      }

      const resObj = result as {
        status?: number;
        statusText?: string;
        headers?: Record<string, string>;
        data?: unknown;
      };

      const status = resObj.status ?? 200;
      const statusText = resObj.statusText ?? 'OK';
      const headers = resObj.headers ?? { 'content-type': 'application/json' };
      const serialized = typeof resObj.data === 'string' ? resObj.data : JSON.stringify(resObj.data ?? null);

      return {
        status,
        statusText,
        headers,
        text: async () => serialized,
        json: async () => resObj.data ?? null,
        blob: async () => new Blob([serialized]),
        arrayBuffer: async () => new TextEncoder().encode(serialized).buffer,
        rawResponse: resObj,
      };
    },
  };
}

/**
 * Standard fetch transport instance.
 */
export const fetchHttpTransport: VKHttpTransport = createVKFetchTransport();

/**
 * Standard fetch transport conforming to VK naming convention (AP.03).
 */
export const vkFetchHttpTransport = fetchHttpTransport;

