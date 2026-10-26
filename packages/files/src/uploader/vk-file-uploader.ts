// [CS.01] Resilient File Uploader with chunking and concurrency control
// [CS.03] AbortSignal cancellation support
import { VKResult, VKError } from '@vk-blocks/core';
import { VKFileChunk, VKChunkUploadOptions, VKUploadProgress } from '../types/file.js';

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_CONCURRENCY = 3;

/**
 * Splits any Blob or File into discrete chunks for parallel, resumable transmission.
 */
export function splitFileIntoChunks(file: Blob, chunkSize: number = DEFAULT_CHUNK_SIZE): VKFileChunk[] {
  const chunks: VKFileChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    const blob = file.slice(start, end);
    chunks.push({
      index,
      start,
      end,
      size: end - start,
      blob,
    });
    start = end;
    index++;
  }

  return chunks;
}

/**
 * Uploads a file with chunking, concurrency control, progress notification, and cancellation.
 */
export async function uploadFileChunks<TResult = unknown>(
  file: Blob,
  options: VKChunkUploadOptions<TResult>
): Promise<VKResult<TResult>> {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY);
  const signal = options.signal;

  if (signal?.aborted) {
    return VKResult.failure(VKError.failure('File.Aborted', 'Upload was aborted before starting.'));
  }

  const chunks = splitFileIntoChunks(file, chunkSize);
  const totalChunks = chunks.length;
  const totalBytes = file.size;
  let loadedBytes = 0;

  const notify = (stage: VKUploadProgress['stage'], currentChunk?: number) => {
    if (options.onProgress) {
      const percentage = totalBytes > 0 ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : 100;
      options.onProgress({
        loadedBytes,
        totalBytes,
        percentage,
        stage,
        currentChunk,
        totalChunks,
      });
    }
  };

  notify('chunking');

  // Queue-based worker pool for concurrency control
  let chunkQueueIndex = 0;
  let uploadError: string | null = null;

  notify('uploading');

  async function worker(): Promise<void> {
    while (chunkQueueIndex < chunks.length) {
      if (signal?.aborted) {
        uploadError = 'Upload aborted by client.';
        return;
      }
      if (uploadError) {
        return;
      }

      const currentIndex = chunkQueueIndex++;
      const currentChunk = chunks[currentIndex];

      try {
        const response = await options.uploadChunk(currentChunk, signal);
        if (!response.success) {
          uploadError = response.error || `Failed to upload chunk ${currentIndex}`;
          return;
        }

        loadedBytes += currentChunk.size;
        notify('uploading', currentIndex + 1);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown upload error';
        uploadError = msg;
        return;
      }
    }
  }

  const workerCount = Math.min(concurrency, totalChunks);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  if (signal?.aborted) {
    notify('aborted');
    return VKResult.failure(VKError.failure('File.Aborted', 'Upload was aborted.'));
  }

  if (uploadError) {
    notify('failed');
    return VKResult.failure(VKError.failure('File.UploadFailed', uploadError));
  }

  // Merging stage
  if (options.mergeChunks) {
    notify('merging');
    try {
      const mergeRes = await options.mergeChunks(totalChunks, signal);
      if (!mergeRes.success) {
        notify('failed');
        return VKResult.failure(VKError.failure('File.MergeFailed', mergeRes.error || 'Failed to merge chunks.'));
      }
      notify('completed');
      return VKResult.success(mergeRes.result as TResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Merge failed';
      notify('failed');
      return VKResult.failure(VKError.failure('File.MergeFailed', msg));
    }
  }

  notify('completed');
  return VKResult.success(undefined as unknown as TResult);
}
