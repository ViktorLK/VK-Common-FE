// [CS.01] [CS.03] Resilient Stateful Upload Session Controller with Pause, Resume, and Validation
import { VKResult, VKError, createUuidV7 } from '@vk-blocks/core';
import type {
  VKChunkUploadOptions,
  VKUploadProgress,
  VKUploadStage,
  VKUploadSessionController,
  VKFileChunk,
} from '../types/file.js';
import { validateFile } from '../validator/vk-file-validator.js';
import { splitFileIntoChunks } from './vk-file-uploader.js';

export interface CreateUploadSessionOptions<TResult = unknown> extends VKChunkUploadOptions<TResult> {
  readonly sessionId?: string;
}

/**
 * Creates a controllable upload session with pause, resume, cancel, and validation support.
 */
export function createUploadSession<TResult = unknown>(
  file: Blob | File,
  options: CreateUploadSessionOptions<TResult>
): VKUploadSessionController<TResult> {
  const sessionId = options.sessionId || createUuidV7();
  let currentStage: VKUploadStage = 'idle';
  let currentProgress: VKUploadProgress | null = null;
  let isPaused = false;
  let isCancelled = false;
  let activeAbortController: AbortController | null = new AbortController();

  let resolveWait: ((result: VKResult<TResult>) => void) | null = null;
  const waitPromise = new Promise<VKResult<TResult>>((resolve) => {
    resolveWait = resolve;
  });

  const chunkSize = options.chunkSize ?? 5 * 1024 * 1024;
  const concurrency = Math.max(1, options.concurrency ?? 3);

  // Link external signal if provided
  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      cancel();
    }, { once: true });
  }

  const updateStage = (stage: VKUploadStage, loadedBytes = 0, currentChunk?: number, totalChunks?: number) => {
    currentStage = stage;
    const totalBytes = file.size;
    const percentage = totalBytes > 0 ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : 100;

    currentProgress = {
      loadedBytes,
      totalBytes,
      percentage,
      stage,
      currentChunk,
      totalChunks,
    };

    options.onProgress?.(currentProgress);
  };

  let unpauseSignalResolver: (() => void) | null = null;

  const waitForUnpause = async (): Promise<boolean> => {
    if (!isPaused) return true;
    return new Promise((resolve) => {
      unpauseSignalResolver = () => {
        unpauseSignalResolver = null;
        resolve(!isCancelled);
      };
    });
  };

  // Asynchronous Execution Runner
  const run = async (): Promise<void> => {
    try {
      // 1. Validation
      updateStage('validating');
      const valRes = await validateFile(file, options.validation);
      if (valRes.isFailure) {
        updateStage('failed');
        resolveWait?.(VKResult.failure(valRes.error));
        return;
      }

      // 2. Chunking
      updateStage('chunking');
      const chunks = splitFileIntoChunks(file, chunkSize);
      const totalChunks = chunks.length;
      let loadedBytes = 0;
      const uploadedIndices = new Set<number>();

      updateStage('uploading', 0, 0, totalChunks);

      // 3. Worker pool for chunk upload with pause/resume loops
      let chunkQueueIndex = 0;
      let uploadError: string | null = null;

      async function worker(): Promise<void> {
        while (chunkQueueIndex < chunks.length) {
          if (isCancelled || activeAbortController?.signal.aborted) {
            uploadError = 'Upload was cancelled.';
            return;
          }
          if (isPaused) {
            const canContinue = await waitForUnpause();
            if (!canContinue || isCancelled) {
              uploadError = 'Upload was cancelled while paused.';
              return;
            }
          }
          if (uploadError) return;

          const currentIndex = chunkQueueIndex++;
          const currentChunk: VKFileChunk = chunks[currentIndex];

          try {
            const res = await options.uploadChunk(currentChunk, activeAbortController?.signal);
            if (!res.success) {
              uploadError = res.error || `Failed to transmit chunk ${currentIndex}`;
              return;
            }

            if (!uploadedIndices.has(currentIndex)) {
              uploadedIndices.add(currentIndex);
              loadedBytes += currentChunk.size;
              updateStage('uploading', loadedBytes, currentIndex + 1, totalChunks);
            }
          } catch (err) {
            uploadError = err instanceof Error ? err.message : 'Chunk transmission error';
            return;
          }
        }
      }

      const workers = Array.from({ length: Math.min(concurrency, totalChunks) }, () => worker());
      await Promise.all(workers);

      if (isCancelled) {
        updateStage('aborted');
        resolveWait?.(VKResult.failure(VKError.failure('File.Aborted', 'Upload was aborted.')));
        return;
      }

      if (uploadError) {
        updateStage('failed');
        resolveWait?.(VKResult.failure(VKError.failure('File.UploadFailed', uploadError)));
        return;
      }

      // 4. Merge Stage
      if (options.mergeChunks) {
        updateStage('merging', loadedBytes, totalChunks, totalChunks);
        const mergeRes = await options.mergeChunks(totalChunks, activeAbortController?.signal);
        if (!mergeRes.success) {
          updateStage('failed', loadedBytes, totalChunks, totalChunks);
          resolveWait?.(
            VKResult.failure(VKError.failure('File.MergeFailed', mergeRes.error || 'Failed to merge file.'))
          );
          return;
        }

        updateStage('completed', file.size, totalChunks, totalChunks);
        resolveWait?.(VKResult.success(mergeRes.result as TResult));
        return;
      }

      updateStage('completed', file.size, totalChunks, totalChunks);
      resolveWait?.(VKResult.success(undefined as unknown as TResult));
    } catch (err) {
      updateStage('failed');
      const msg = err instanceof Error ? err.message : 'Unknown session error';
      resolveWait?.(VKResult.failure(VKError.failure('File.SessionError', msg)));
    }
  };

  // Kick off background execution
  void run();

  const pause = async (): Promise<VKResult<void>> => {
    if (isPaused || currentStage === 'completed' || currentStage === 'failed' || isCancelled) {
      return VKResult.success(undefined);
    }
    isPaused = true;
    updateStage('paused', currentProgress?.loadedBytes ?? 0, currentProgress?.currentChunk, currentProgress?.totalChunks);
    return VKResult.success(undefined);
  };

  const resume = async (): Promise<VKResult<void>> => {
    if (!isPaused || isCancelled) {
      return VKResult.success(undefined);
    }
    isPaused = false;
    updateStage('uploading', currentProgress?.loadedBytes ?? 0, currentProgress?.currentChunk, currentProgress?.totalChunks);
    if (unpauseSignalResolver) {
      unpauseSignalResolver();
    }
    return VKResult.success(undefined);
  };

  const cancel = (): void => {
    if (isCancelled) return;
    isCancelled = true;
    isPaused = false;
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    if (unpauseSignalResolver) {
      unpauseSignalResolver();
    }
    updateStage('aborted');
  };

  return {
    id: sessionId,
    getStatus: () => currentStage,
    getProgress: () => currentProgress,
    pause,
    resume,
    cancel,
    wait: () => waitPromise,
  };
}
