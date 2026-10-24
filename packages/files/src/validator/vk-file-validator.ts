// [CS.01] [AP.01] Declarative Client-Side File Validation & Preview Kind Detector
import { VKResult, VKError } from '@vk-blocks/core';
import type { VKFileValidationOptions, VKPreviewKind } from '../types/file.js';

/**
 * Validates a Blob or File against size, MIME, and extension rules before transport.
 */
export async function validateFile(
  file: Blob | File,
  options?: VKFileValidationOptions
): Promise<VKResult<void>> {
  if (!file) {
    return VKResult.failure(VKError.failure('File.Invalid', 'No file object provided.'));
  }

  if (!options) {
    return VKResult.success(undefined);
  }

  // 1. Min Size Check
  if (options.minSizeBytes !== undefined && file.size < options.minSizeBytes) {
    return VKResult.failure(
      VKError.failure(
        'File.TooSmall',
        `File size (${file.size} bytes) is below minimum allowed (${options.minSizeBytes} bytes).`
      )
    );
  }

  // 2. Max Size Check
  if (options.maxSizeBytes !== undefined && file.size > options.maxSizeBytes) {
    return VKResult.failure(
      VKError.failure(
        'File.TooLarge',
        `File size (${file.size} bytes) exceeds maximum limit (${options.maxSizeBytes} bytes).`
      )
    );
  }

  // 3. MIME Whitelist Check
  const mimeType = file.type?.toLowerCase() || '';
  if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
    const isMimeAllowed = options.allowedMimeTypes.some((allowed) => {
      const lower = allowed.toLowerCase().trim();
      if (lower.endsWith('/*')) {
        const prefix = lower.slice(0, -1);
        return mimeType.startsWith(prefix);
      }
      return mimeType === lower;
    });

    if (!isMimeAllowed && mimeType !== '') {
      return VKResult.failure(
        VKError.failure(
          'File.InvalidType',
          `MIME type "${mimeType}" is not allowed. Supported: ${options.allowedMimeTypes.join(', ')}`
        )
      );
    }
  }

  // 4. Extension Whitelist Check (if File)
  if ('name' in file && typeof file.name === 'string' && options.allowedExtensions && options.allowedExtensions.length > 0) {
    const name = file.name.toLowerCase();
    const isExtAllowed = options.allowedExtensions.some((ext) => {
      const normalized = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
      return name.endsWith(normalized);
    });

    if (!isExtAllowed) {
      return VKResult.failure(
        VKError.failure(
          'File.InvalidExtension',
          `File extension is not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`
        )
      );
    }
  }

  // 5. Custom Validator Hook
  if (options.customValidator) {
    try {
      const customRes = await options.customValidator(file);
      if (customRes.isFailure) {
        return customRes;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Custom file validation failed.';
      return VKResult.failure(VKError.failure('File.ValidationException', msg));
    }
  }

  return VKResult.success(undefined);
}

/**
 * Maps a file name and MIME type to a high-level preview renderer strategy.
 */
export function detectPreviewKind(fileName: string, mimeType?: string): VKPreviewKind {
  const lowerName = fileName.toLowerCase();
  const lowerMime = (mimeType ?? '').toLowerCase();

  // Images
  if (
    lowerMime.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(lowerName)
  ) {
    return 'image';
  }

  // PDF
  if (lowerMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return 'pdf';
  }

  // Video
  if (
    lowerMime.startsWith('video/') ||
    /\.(mp4|webm|ogg|mov|mkv)$/i.test(lowerName)
  ) {
    return 'video';
  }

  // Audio
  if (
    lowerMime.startsWith('audio/') ||
    /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(lowerName)
  ) {
    return 'audio';
  }

  // JSON
  if (
    lowerMime === 'application/json' ||
    lowerMime === 'application/manifest+json' ||
    lowerName.endsWith('.json') ||
    lowerName.endsWith('.jsonc')
  ) {
    return 'json';
  }

  // Code & Markdown & Text
  if (
    lowerMime.startsWith('text/') ||
    /\.(ts|tsx|js|jsx|css|scss|html|xml|yaml|yml|md|markdown|sql|sh|bash|py|rs|go|cs|java|c|cpp|h)$/i.test(
      lowerName
    )
  ) {
    return 'code';
  }

  // Office documents
  if (
    /\.(docx?|xlsx?|pptx?|csv)$/i.test(lowerName) ||
    lowerMime.includes('officedocument') ||
    lowerMime.includes('excel') ||
    lowerMime.includes('word') ||
    lowerMime.includes('powerpoint')
  ) {
    return 'office';
  }

  return 'unsupported';
}
