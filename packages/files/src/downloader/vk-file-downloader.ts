// [CS.01] Stream File Downloader with progress tracking
// [CS.03] AbortSignal cancellation support
import { VKResult, VKError } from '@vk-blocks/core';
import { VKDownloadProgress } from '../types/file.js';

export interface DownloadStreamOptions {
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: VKDownloadProgress) => void;
}

/**
 * Downloads a remote resource as a Blob via streaming, preventing memory overflow
 * while continuously dispatching progress events.
 */
export async function downloadFileStream(
  url: string,
  options?: DownloadStreamOptions
): Promise<VKResult<Blob>> {
  try {
    const response = await fetch(url, { signal: options?.signal });
    if (!response.ok) {
      return VKResult.failure(
        VKError.failure('File.DownloadFailed', `HTTP ${response.status}: ${response.statusText}`)
      );
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : undefined;

    if (!response.body) {
      const blob = await response.blob();
      options?.onProgress?.({ loadedBytes: blob.size, totalBytes: blob.size, percentage: 100 });
      return VKResult.success(blob);
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loadedBytes = 0;

    while (true) {
      if (options?.signal?.aborted) {
        return VKResult.failure(VKError.failure('File.Aborted', 'Download was aborted.'));
      }

      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        chunks.push(value);
        loadedBytes += value.length;
        const percentage = totalBytes ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : undefined;
        options?.onProgress?.({ loadedBytes, totalBytes, percentage });
      }
    }

    const blob = new Blob(chunks as unknown as BlobPart[], {
      type: response.headers.get('content-type') || 'application/octet-stream',
    });

    return VKResult.success(blob);
  } catch (err: unknown) {
    if (options?.signal?.aborted) {
      return VKResult.failure(VKError.failure('File.Aborted', 'Download was aborted.'));
    }
    const msg = err instanceof Error ? err.message : 'Unknown download error';
    return VKResult.failure(VKError.failure('File.DownloadError', msg));
  }
}
