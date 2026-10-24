import { useState, useCallback, useRef } from 'react';
import { VKResult } from '@vk-blocks/core';
import { VKUploadProgress, VKChunkUploadOptions } from '../types/file.js';
import { uploadFileChunks } from '../uploader/vk-file-uploader.js';

export interface UseVKFileUploadReturn<TResult = unknown> {
  progress: VKUploadProgress | null;
  isUploading: boolean;
  upload: (
    file: Blob,
    options: Omit<VKChunkUploadOptions<TResult>, 'signal' | 'onProgress'>
  ) => Promise<VKResult<TResult>>;
  cancel: () => void;
}

/**
 * React Hook providing stateful tracking and cancellation for chunked uploads.
 */
export function useVKFileUpload<TResult = unknown>(): UseVKFileUploadReturn<TResult> {
  const [progress, setProgress] = useState<VKUploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const upload = useCallback(
    async (
      file: Blob,
      options: Omit<VKChunkUploadOptions<TResult>, 'signal' | 'onProgress'>
    ): Promise<VKResult<TResult>> => {
      cancel();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsUploading(true);

      const result = await uploadFileChunks<TResult>(file, {
        ...options,
        signal: controller.signal,
        onProgress: (p) => {
          setProgress(p);
        },
      });

      setIsUploading(false);
      abortControllerRef.current = null;
      return result;
    },
    [cancel]
  );

  return {
    progress,
    isUploading,
    upload,
    cancel,
  };
}
