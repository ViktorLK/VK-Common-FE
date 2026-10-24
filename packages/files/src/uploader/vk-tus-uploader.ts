// [CS.01] Tus v1.0.0 Resumable File Uploader
// [CS.03] AbortSignal cancellation support
// [FS-06] Resilient transport with automatic retry, HEAD probe, and offset reconciliation
import { VKResult, VKError, vkAssert } from '@vk-blocks/core';
import type { VKUploadProgress, VKUploadStage } from '../types/file.js';

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

export interface VKTusUploadOptions {
  /**
   * The Tus creation endpoint (POST) where new upload resources are initialized.
   * Required if uploadUrl is not already known.
   */
  readonly endpoint?: string;

  /**
   * Existing upload URL (from a previous session) to probe (HEAD) and resume (PATCH).
   */
  readonly uploadUrl?: string;

  /**
   * Chunk size in bytes for each PATCH request (default: 5MB).
   */
  readonly chunkSize?: number;

  /**
   * Custom metadata key-value pairs (encoded into Tus-Metadata header).
   */
  readonly metadata?: Record<string, string>;

  /**
   * Custom HTTP request headers (e.g. Authorization token).
   */
  readonly headers?: Record<string, string>;

  /**
   * AbortSignal for aborting the upload.
   */
  readonly signal?: AbortSignal;

  /**
   * Custom fetch function (defaults to globalThis.fetch).
   */
  readonly fetch?: typeof fetch;

  /**
   * Maximum retry attempts for transient chunk failures (default: 3).
   */
  readonly maxRetries?: number;

  /**
   * Base backoff delay in milliseconds for retry attempts (default: 1000ms).
   */
  readonly retryDelayMs?: number;

  /**
   * Callback invoked as upload progresses.
   */
  readonly onProgress?: (progress: VKUploadProgress) => void;

  /**
   * Callback invoked as soon as the server upload resource URL is resolved or created.
   */
  readonly onUploadUrlResolved?: (uploadUrl: string) => void;
}

export interface VKTusUploadResult {
  readonly uploadUrl: string;
  readonly totalBytes: number;
  readonly metadata?: Record<string, string>;
}

/**
 * Encodes metadata record to Tus v1.0.0 Upload-Metadata header format:
 * comma-separated pairs of `key base64value`.
 */
function encodeTusMetadata(metadata: Record<string, string>): string {
  const pairs: string[] = [];
  for (const [key, val] of Object.entries(metadata)) {
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;

    let base64Val = '';
    if (typeof btoa !== 'undefined') {
      base64Val = btoa(unescape(encodeURIComponent(val)));
    } else if (typeof Buffer !== 'undefined') {
      base64Val = Buffer.from(val, 'utf-8').toString('base64');
    }

    pairs.push(`${trimmedKey} ${base64Val}`);
  }
  return pairs.join(',');
}

/**
 * Resolves a potentially relative Location header into an absolute URL.
 */
function resolveLocationUrl(location: string, baseEndpoint?: string): string {
  if (location.startsWith('http://') || location.startsWith('https://')) {
    return location;
  }
  if (baseEndpoint) {
    try {
      return new URL(location, baseEndpoint).toString();
    } catch {
      return location;
    }
  }
  return location;
}

/**
 * Production-ready Tus v1.0.0 Resumable File Uploader.
 * Supports Creation Extension, Resume probe (HEAD), Chunk streaming (PATCH),
 * automatic backoff retries, and cancellation via AbortSignal.
 */
export class VKTusUploader {
  private internalAbortController: AbortController | null = null;
  private currentUploadUrl: string | null = null;
  private currentOffset = 0;
  private isUploading = false;

  constructor(
    private readonly file: Blob,
    private readonly options: VKTusUploadOptions = {}
  ) {
    // [AP.01] Boundary validation
    vkAssert.notNull(file, 'file');
    if (options.uploadUrl) {
      this.currentUploadUrl = options.uploadUrl;
    }
  }

  /**
   * Returns the server upload URL if resolved, or null.
   */
  public getUploadUrl(): string | null {
    return this.currentUploadUrl;
  }

  /**
   * Returns the current uploaded byte offset.
   */
  public getOffset(): number {
    return this.currentOffset;
  }

  /**
   * Aborts the ongoing upload transmission.
   */
  public abort(): void {
    if (this.internalAbortController) {
      this.internalAbortController.abort();
      this.internalAbortController = null;
    }
    this.isUploading = false;
  }

  /**
   * Initiates or resumes the Tus upload workflow.
   */
  public async start(): Promise<VKResult<VKTusUploadResult>> {
    if (this.isUploading) {
      return VKResult.failure(VKError.failure('Tus.Busy', 'Upload is already in progress.'));
    }

    const externalSignal = this.options.signal;
    if (externalSignal?.aborted) {
      return VKResult.failure(VKError.failure('File.Aborted', 'Upload was aborted before starting.'));
    }

    this.internalAbortController = new AbortController();
    this.isUploading = true;

    // Link external signal to internal controller
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => this.abort(), { once: true });
    }

    const effectiveSignal = this.internalAbortController.signal;
    const fetchFn = this.options.fetch ?? globalThis.fetch;
    const chunkSize = this.options.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const maxRetries = this.options.maxRetries ?? DEFAULT_MAX_RETRIES;
    const retryDelayMs = this.options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

    try {
      let uploadUrl = this.currentUploadUrl;

      // 1. Resolve or create upload URL
      if (uploadUrl) {
        // Probe existing upload via HEAD request
        const probeRes = await this.probeServerOffset(uploadUrl, fetchFn, effectiveSignal);
        if (probeRes.isSuccess) {
          this.currentOffset = probeRes.value;
          this.options.onUploadUrlResolved?.(uploadUrl);
        } else {
          // If existing upload URL expired or failed, fallback to creating new if endpoint exists
          if (!this.options.endpoint) {
            this.isUploading = false;
            return VKResult.failure(probeRes.error);
          }
          uploadUrl = null;
        }
      }

      if (!uploadUrl) {
        if (!this.options.endpoint) {
          this.isUploading = false;
          return VKResult.failure(
            VKError.failure('Tus.MissingEndpoint', 'Either endpoint or uploadUrl must be provided.')
          );
        }

        const createRes = await this.createUploadResource(this.options.endpoint, fetchFn, effectiveSignal);
        if (!createRes.isSuccess) {
          this.isUploading = false;
          return VKResult.failure(createRes.error);
        }

        uploadUrl = createRes.value;
        this.currentUploadUrl = uploadUrl;
        this.currentOffset = 0;
        this.options.onUploadUrlResolved?.(uploadUrl);
      }

      this.notify('uploading');

      // 2. Transmit chunks sequentially using PATCH
      while (this.currentOffset < this.file.size) {
        if (effectiveSignal.aborted) {
          this.notify('aborted');
          this.isUploading = false;
          return VKResult.failure(VKError.failure('File.Aborted', 'Upload was aborted.'));
        }

        const nextOffset = Math.min(this.currentOffset + chunkSize, this.file.size);
        const chunkBlob = this.file.slice(this.currentOffset, nextOffset);

        let attempt = 0;
        let chunkUploaded = false;

        while (attempt <= maxRetries && !chunkUploaded) {
          if (effectiveSignal.aborted) {
            this.notify('aborted');
            this.isUploading = false;
            return VKResult.failure(VKError.failure('File.Aborted', 'Upload was aborted.'));
          }

          try {
            const response = await fetchFn(uploadUrl, {
              method: 'PATCH',
              headers: {
                'Tus-Resumable': '1.0.0',
                'Upload-Offset': String(this.currentOffset),
                'Content-Type': 'application/offset+octet-stream',
                ...(this.options.headers ?? {}),
              },
              body: chunkBlob,
              signal: effectiveSignal,
            });

            if (response.status === 204 || response.status === 200) {
              const serverOffsetHeader = response.headers.get('Upload-Offset');
              if (serverOffsetHeader !== null) {
                const parsed = parseInt(serverOffsetHeader, 10);
                if (!Number.isNaN(parsed) && parsed >= this.currentOffset) {
                  this.currentOffset = parsed;
                } else {
                  this.currentOffset = nextOffset;
                }
              } else {
                this.currentOffset = nextOffset;
              }

              chunkUploaded = true;
              this.notify(this.currentOffset >= this.file.size ? 'completed' : 'uploading');
              break;
            }

            // 409 Conflict: client offset and server offset mismatch -> re-probe offset via HEAD
            if (response.status === 409) {
              const probeRes = await this.probeServerOffset(uploadUrl, fetchFn, effectiveSignal);
              if (probeRes.isSuccess) {
                this.currentOffset = probeRes.value;
                chunkUploaded = true;
                this.notify('uploading');
                break;
              }
            }

            // Non-recoverable client error
            if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
              this.notify('failed');
              this.isUploading = false;
              return VKResult.failure(
                VKError.failure(
                  'Tus.PatchFailed',
                  `Chunk upload rejected with status ${response.status}: ${response.statusText}`
                )
              );
            }

            // Retryable error
            attempt++;
            if (attempt <= maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
            }
          } catch (err: unknown) {
            if (effectiveSignal.aborted) {
              this.notify('aborted');
              this.isUploading = false;
              return VKResult.failure(VKError.failure('File.Aborted', 'Upload was aborted.'));
            }

            attempt++;
            if (attempt <= maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
            } else {
              const message = err instanceof Error ? err.message : 'Unknown network error';
              this.notify('failed');
              this.isUploading = false;
              return VKResult.failure(VKError.failure('Tus.UploadFailed', message));
            }
          }
        }

        if (!chunkUploaded && attempt > maxRetries) {
          this.notify('failed');
          this.isUploading = false;
          return VKResult.failure(
            VKError.failure(
              'Tus.UploadFailed',
              `Exceeded maximum retries (${maxRetries}) for chunk at offset ${this.currentOffset}.`
            )
          );
        }
      }

      this.isUploading = false;
      this.notify('completed');

      return VKResult.success({
        uploadUrl,
        totalBytes: this.file.size,
        metadata: this.options.metadata,
      });
    } catch (err: unknown) {
      this.isUploading = false;
      this.notify('failed');
      const message = err instanceof Error ? err.message : 'Tus upload failed unexpectedly.';
      return VKResult.failure(VKError.failure('Tus.InternalError', message));
    }
  }

  private async probeServerOffset(
    uploadUrl: string,
    fetchFn: typeof fetch,
    signal?: AbortSignal
  ): Promise<VKResult<number>> {
    try {
      const response = await fetchFn(uploadUrl, {
        method: 'HEAD',
        headers: {
          'Tus-Resumable': '1.0.0',
          ...(this.options.headers ?? {}),
        },
        signal,
      });

      if (response.status === 404 || response.status === 410) {
        return VKResult.failure(
          VKError.notFound('Tus.UploadNotFound', `Tus upload resource "${uploadUrl}" not found or expired.`)
        );
      }

      if (!response.ok) {
        return VKResult.failure(
          VKError.failure('Tus.ProbeFailed', `HEAD request failed with status ${response.status}: ${response.statusText}`)
        );
      }

      const offsetHeader = response.headers.get('Upload-Offset');
      if (offsetHeader === null) {
        return VKResult.failure(
          VKError.failure('Tus.MissingOffset', 'Server response missing Upload-Offset header.')
        );
      }

      const offset = parseInt(offsetHeader, 10);
      if (Number.isNaN(offset) || offset < 0) {
        return VKResult.failure(
          VKError.failure('Tus.InvalidOffset', `Invalid Upload-Offset received: "${offsetHeader}".`)
        );
      }

      return VKResult.success(offset);
    } catch (err: unknown) {
      if (signal?.aborted) {
        return VKResult.failure(VKError.failure('File.Aborted', 'Upload probe was aborted.'));
      }
      const message = err instanceof Error ? err.message : 'Unknown probe error';
      return VKResult.failure(VKError.failure('Tus.NetworkError', message));
    }
  }

  private async createUploadResource(
    endpoint: string,
    fetchFn: typeof fetch,
    signal?: AbortSignal
  ): Promise<VKResult<string>> {
    try {
      const headers: Record<string, string> = {
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(this.file.size),
        ...(this.options.headers ?? {}),
      };

      if (this.options.metadata && Object.keys(this.options.metadata).length > 0) {
        headers['Upload-Metadata'] = encodeTusMetadata(this.options.metadata);
      }

      const response = await fetchFn(endpoint, {
        method: 'POST',
        headers,
        signal,
      });

      if (!response.ok && response.status !== 201 && response.status !== 200 && response.status !== 204) {
        return VKResult.failure(
          VKError.failure(
            'Tus.CreateFailed',
            `Failed to create upload resource with status ${response.status}: ${response.statusText}`
          )
        );
      }

      const locationHeader = response.headers.get('Location');
      if (!locationHeader) {
        return VKResult.failure(
          VKError.failure('Tus.MissingLocation', 'Tus server responded without a Location header.')
        );
      }

      const resolvedUrl = resolveLocationUrl(locationHeader, endpoint);
      return VKResult.success(resolvedUrl);
    } catch (err: unknown) {
      if (signal?.aborted) {
        return VKResult.failure(VKError.failure('File.Aborted', 'Upload creation was aborted.'));
      }
      const message = err instanceof Error ? err.message : 'Unknown creation error';
      return VKResult.failure(VKError.failure('Tus.NetworkError', message));
    }
  }

  private notify(stage: VKUploadStage): void {
    if (this.options.onProgress) {
      const totalBytes = this.file.size;
      const percentage = totalBytes > 0 ? Math.min(100, Math.round((this.currentOffset / totalBytes) * 100)) : 100;
      this.options.onProgress({
        loadedBytes: this.currentOffset,
        totalBytes,
        percentage,
        stage,
      });
    }
  }
}

/**
 * Functional convenience helper for initiating or resuming a Tus upload.
 */
export async function uploadFileWithTus(
  file: Blob,
  options: VKTusUploadOptions
): Promise<VKResult<VKTusUploadResult>> {
  const uploader = new VKTusUploader(file, options);
  return uploader.start();
}
