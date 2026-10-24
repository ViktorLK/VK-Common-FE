// [MB.02] Explicit barrel export - Files Layer
export type {
  VKFileChunk,
  VKUploadStage,
  VKUploadProgress,
  VKChunkUploadOptions,
  VKDownloadProgress,
  VKFileValidationOptions,
  VKPreviewKind,
  VKParsedFileEntry,
  VKUploadSessionController,
} from './types/file.js';

export {
  splitFileIntoChunks,
  uploadFileChunks,
} from './uploader/vk-file-uploader.js';

export {
  createUploadSession,
  type CreateUploadSessionOptions,
} from './uploader/vk-upload-session.js';

export {
  VKTusUploader,
  uploadFileWithTus,
  type VKTusUploadOptions,
  type VKTusUploadResult,
} from './uploader/vk-tus-uploader.js';

export { downloadFileStream } from './downloader/vk-file-downloader.js';
export type { DownloadStreamOptions } from './downloader/vk-file-downloader.js';

export {
  validateFile,
  detectPreviewKind,
} from './validator/vk-file-validator.js';

export {
  parseDirectoryEntries,
  parseClipboardFiles,
} from './parser/vk-input-parsers.js';

export { useVKFileUpload } from './hooks/useVKFileUpload.js';
export type { UseVKFileUploadReturn } from './hooks/useVKFileUpload.js';
