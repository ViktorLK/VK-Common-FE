// [CS.01] [BASE-01] Typed contracts for file operations, validation, and session lifecycle
import { type VKResult } from '@vk-blocks/core';

export interface VKFileChunk {
  readonly index: number;
  readonly start: number;
  readonly end: number;
  readonly size: number;
  readonly blob: Blob;
}

export type VKUploadStage =
  | 'idle'
  | 'validating'
  | 'chunking'
  | 'uploading'
  | 'paused'
  | 'merging'
  | 'completed'
  | 'failed'
  | 'aborted';

export interface VKUploadProgress {
  readonly loadedBytes: number;
  readonly totalBytes: number;
  readonly percentage: number;
  readonly stage: VKUploadStage;
  readonly currentChunk?: number;
  readonly totalChunks?: number;
}

export interface VKFileValidationOptions {
  readonly maxSizeBytes?: number;
  readonly minSizeBytes?: number;
  readonly allowedMimeTypes?: readonly string[];
  readonly allowedExtensions?: readonly string[];
  readonly customValidator?: (file: Blob | File) => Promise<VKResult<void>> | VKResult<void>;
}

export type VKPreviewKind =
  | 'image'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'code'
  | 'json'
  | 'office'
  | 'unsupported';

export interface VKParsedFileEntry {
  readonly file: File;
  readonly relativePath: string;
  readonly pathSegments: readonly string[];
}

export interface VKChunkUploadOptions<TResult = unknown> {
  readonly chunkSize?: number;
  readonly concurrency?: number;
  readonly signal?: AbortSignal;
  readonly validation?: VKFileValidationOptions;
  readonly onProgress?: (progress: VKUploadProgress) => void;
  readonly uploadChunk: (
    chunk: VKFileChunk,
    signal?: AbortSignal
  ) => Promise<{ success: boolean; error?: string }>;
  readonly mergeChunks?: (
    totalChunks: number,
    signal?: AbortSignal
  ) => Promise<{ success: boolean; result?: TResult; error?: string }>;
}

export interface VKUploadSessionController<TResult = unknown> {
  readonly id: string;
  readonly getStatus: () => VKUploadStage;
  readonly getProgress: () => VKUploadProgress | null;
  pause(): Promise<VKResult<void>>;
  resume(): Promise<VKResult<void>>;
  cancel(): void;
  wait(): Promise<VKResult<TResult>>;
}

export interface VKDownloadProgress {
  readonly loadedBytes: number;
  readonly totalBytes?: number;
  readonly percentage?: number;
}
