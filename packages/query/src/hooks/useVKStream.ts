import { useState, useCallback, useRef } from 'react';
import { VKError } from '@vk-blocks/core';

export interface UseVKStreamOptions {
  readonly onChunk?: (chunk: string) => void;
  readonly onFinish?: (fullText: string) => void;
  readonly onError?: (error: VKError) => void;
  /** Custom fetcher function to allow mocking or injecting auth headers */
  readonly fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export interface UseVKStreamDynamicOptions {
  readonly onChunk?: (chunk: string) => void;
  readonly onFinish?: (fullText: string) => void;
  readonly onError?: (error: VKError) => void;
  readonly fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export interface UseVKStreamResult {
  readonly text: string;
  readonly isStreaming: boolean;
  readonly error: VKError | null;
  readonly startStream: (body?: unknown, customUrl?: string, dynamicOptions?: UseVKStreamDynamicOptions) => Promise<void>;
  readonly stopStream: () => void;
}

/**
 * Production-ready streaming hook for SSE and chunked transfer streams.
 * Integrates directly with VKError and ensures resilient abort/cancellation handling.
 */
export function useVKStream(url: string, options: UseVKStreamOptions = {}): UseVKStreamResult {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<VKError | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (body?: unknown, customUrl?: string, dynamicOptions?: UseVKStreamDynamicOptions) => {
      setIsStreaming(true);
      setText('');
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const fetchFn = dynamicOptions?.fetcher ?? options.fetcher ?? fetch;
        const targetUrl = customUrl ?? url;

        const response = await fetchFn(targetUrl, {
          method: body !== undefined ? 'POST' : 'GET',
          headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        if (!response.ok) {
          const vkErr = VKError.failure(
            'Stream.HttpError',
            `Streaming request failed with HTTP ${response.status}: ${response.statusText}`
          );
          setError(vkErr);
          options.onError?.(vkErr);
          dynamicOptions?.onError?.(vkErr);
          return;
        }

        if (!response.body) {
          const vkErr = VKError.failure('Stream.Unsupported', 'ReadableStream is not supported by the response body.');
          setError(vkErr);
          options.onError?.(vkErr);
          dynamicOptions?.onError?.(vkErr);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setText(accumulated);

          options.onChunk?.(chunk);
          dynamicOptions?.onChunk?.(chunk);
        }

        // Final flush
        const finalChunk = decoder.decode();
        if (finalChunk) {
          accumulated += finalChunk;
          setText(accumulated);
          options.onChunk?.(finalChunk);
          dynamicOptions?.onChunk?.(finalChunk);
        }

        options.onFinish?.(accumulated);
        dynamicOptions?.onFinish?.(accumulated);
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          // Aborted gracefully
          return;
        }

        const errorMsg = err instanceof Error ? err.message : 'Unknown stream reading error.';
        const vkErr = VKError.failure('Stream.ReadFailure', errorMsg);
        setError(vkErr);
        options.onError?.(vkErr);
        dynamicOptions?.onError?.(vkErr);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [url, options]
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    text,
    isStreaming,
    error,
    startStream,
    stopStream,
  };
}
