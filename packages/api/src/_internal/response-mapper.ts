// [AP.05] [CS.01] Response mapping engine delivering typed VKResult with RFC 7807 support
import {
  VKError,
  VKErrorCategory,
  VKResult,
  VKSerializer,
} from '@vk-blocks/core';
import type { VKHttpResponse } from '../transport/vk-http-transport.js';
import { mapHttpStatusToErrorType } from '../errors/vk-http-status-mapper.js';
import {
  isVKProblemDetails,
  vkParseProblemDetails,
  type VKProblemDetails,
} from '../errors/vk-problem-details.js';

export { mapHttpStatusToErrorType };

function mapStatusToCategory(status: number): VKErrorCategory {
  if (status === 400) return VKErrorCategory.Validation;
  if (status === 401) return VKErrorCategory.Unauthorized;
  if (status === 403) return VKErrorCategory.Forbidden;
  if (status === 404) return VKErrorCategory.NotFound;
  if (status === 409) return VKErrorCategory.Conflict;
  if (status === 412) return VKErrorCategory.PreconditionFailed;
  if (status === 429) return VKErrorCategory.TooManyRequests;
  if (status === 408 || status === 504) return VKErrorCategory.Timeout;
  if (status === 503) return VKErrorCategory.ServiceUnavailable;
  return VKErrorCategory.Failure;
}

export async function mapResponseToResult<T>(
  response: VKHttpResponse,
  serializer: VKSerializer,
  normalizationHook?: (body: unknown) => unknown,
  responseType: 'json' | 'text' | 'blob' | 'arrayBuffer' = 'json',
): Promise<VKResult<T>> {
  // Successful HTTP response status codes (2xx)
  if (response.status >= 200 && response.status < 300) {
    if (response.status === 204) {
      return VKResult.success(undefined as unknown as T);
    }

    try {
      if (responseType === 'blob') {
        const blobData = await response.blob();
        return VKResult.success(blobData as unknown as T);
      }

      if (responseType === 'arrayBuffer') {
        const bufferData = await response.arrayBuffer();
        return VKResult.success(bufferData as unknown as T);
      }

      if (responseType === 'text') {
        const textData = await response.text();
        return VKResult.success(textData as unknown as T);
      }

      // Default: 'json'
      const text = await response.text();
      if (!text || !text.trim()) {
        return VKResult.success(undefined as unknown as T);
      }

      const rawJson = serializer.deserialize<unknown>(text);

      // Check if body aligns with backend's R1 envelope: { isSuccess, value, errors }
      const hasSuccessFlag =
        rawJson !== null &&
        typeof rawJson === 'object' &&
        'isSuccess' in (rawJson as Record<string, unknown>);

      if (hasSuccessFlag) {
        const standardEnvelope = rawJson as {
          isSuccess: boolean;
          value?: unknown;
          errors?: readonly VKError[];
        };

        if (standardEnvelope.isSuccess) {
          let unwrappedValue = standardEnvelope.value;
          if (normalizationHook) {
            try {
              unwrappedValue = normalizationHook(unwrappedValue);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Normalization hook failed.';
              return VKResult.failure(VKError.failure('HTTP.NormalizationError', msg));
            }
          }
          return VKResult.success(unwrappedValue as T);
        } else {
          return VKResult.failureMany(standardEnvelope.errors || [VKError.nullValue]);
        }
      }

      let payload = rawJson;
      if (normalizationHook) {
        try {
          payload = normalizationHook(payload);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Normalization hook failed.';
          return VKResult.failure(VKError.failure('HTTP.NormalizationError', msg));
        }
      }

      return VKResult.success(payload as T);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to deserialize response.';
      return VKResult.failure(VKError.failure('HTTP.ResponseDeserialization', message));
    }
  }

  // Error response mapping (4xx, 5xx)
  let errorCode = `HTTP.${response.status}`;
  let errorDesc = response.statusText || `HTTP Error ${response.status}`;
  const category = mapStatusToCategory(response.status);

  const headerTraceId =
    response.headers['x-trace-id'] ||
    response.headers['X-Trace-Id'] ||
    response.headers['traceparent'] ||
    response.headers['x-request-id'] ||
    response.headers['X-Request-Id'];

  let resolvedTraceId = headerTraceId;
  let parsedProblemDetails: VKProblemDetails | undefined;

  try {
    const text = await response.text();
    if (text && text.trim()) {
      let body: unknown = null;
      let isJson = false;

      try {
        body = serializer.deserialize<unknown>(text);
        isJson = body !== null && typeof body === 'object';
      } catch {
        // Non-JSON response (e.g. gateway HTML / plain text error)
        const strippedText = text.replace(/<[^>]*>?/gm, '').trim();
        const preview = (strippedText || text).slice(0, 500);
        if (preview) {
          errorDesc = `${response.statusText || `HTTP ${response.status}`}: ${preview}`;
        }
      }

      if (isJson && body) {
        const record = body as Record<string, unknown>;

        if (isVKProblemDetails(record)) {
          parsedProblemDetails = vkParseProblemDetails(record, response.status);
          if (parsedProblemDetails.traceId) {
            resolvedTraceId = parsedProblemDetails.traceId;
          }
        }

        // 1. Check if RFC 7807 HttpValidationProblemDetails with errors dictionary: { errors: { field: string[] } }
        if (record.errors && typeof record.errors === 'object' && record.errors !== null) {
          const errorsDict = record.errors as Record<string, unknown>;
          const validationErrors: VKError[] = [];

          for (const [field, messages] of Object.entries(errorsDict)) {
            if (Array.isArray(messages)) {
              for (const msg of messages) {
                if (typeof msg === 'string') {
                  validationErrors.push(
                    new VKError(
                      `Validation.${field}`,
                      msg,
                      VKErrorCategory.Validation,
                      {
                        status: response.status,
                        traceId: resolvedTraceId,
                        fieldErrors: [{ path: field, code: `Validation.${field}`, message: msg }],
                      },
                    ),
                  );
                }
              }
            } else if (typeof messages === 'string') {
              validationErrors.push(
                new VKError(
                  `Validation.${field}`,
                  messages,
                  VKErrorCategory.Validation,
                  {
                    status: response.status,
                    traceId: resolvedTraceId,
                    fieldErrors: [{ path: field, code: `Validation.${field}`, message: messages }],
                  },
                ),
              );
            }
          }

          if (validationErrors.length > 0) {
            return VKResult.failureMany(validationErrors);
          }
        }

        // 2. Check if RFC 7807 ProblemDetails with title or detail
        if (typeof record.title === 'string' || typeof record.detail === 'string') {
          if (typeof record.code === 'string') {
            errorCode = record.code;
          } else if (typeof record.title === 'string') {
            errorCode = `HTTP.${response.status}.${record.title.replace(/\s+/g, '')}`;
          }

          if (typeof record.detail === 'string') {
            errorDesc = record.detail;
          } else if (typeof record.description === 'string') {
            errorDesc = record.description;
          } else if (typeof record.title === 'string') {
            errorDesc = record.title;
          }
        } else {
          // 3. Backward compatible legacy { code?: string; description?: string }
          if (typeof record.code === 'string') errorCode = record.code;
          if (typeof record.description === 'string') errorDesc = record.description;
        }
      }
    }
  } catch {
    // ignore
  }

  const err = new VKError(
    errorCode,
    errorDesc,
    category,
    {
      status: response.status,
      traceId: resolvedTraceId,
      fieldErrors: parsedProblemDetails?.fieldErrors,
      detail: parsedProblemDetails?.detail,
      title: parsedProblemDetails?.title,
      instance: parsedProblemDetails?.instance,
      extensions: parsedProblemDetails ? { problemDetails: parsedProblemDetails } : undefined,
    },
  );

  return VKResult.failure(err);
}
