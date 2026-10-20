// [CS.01] Envelope types and error mappings for @vk-blocks/api
import { VKError, VKErrorType } from '@vk-blocks/core';

/**
 * Standard pagination representation matching backend PagedList / IPagedResponse.
 */
export interface VKPagination {
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

/**
 * Strongly-typed paginated list matching backend PagedList<T>.
 */
export interface VKPagedList<T> {
  readonly items: readonly T[];
  readonly pagination: VKPagination;
}

/**
 * Standard cursor pagination representation matching backend CursorPagedList.
 */
export interface VKCursorPagination<TCursor = string> {
  readonly cursor?: TCursor | null;
  readonly nextCursor?: TCursor | null;
  readonly prevCursor?: TCursor | null;
  readonly hasMore: boolean;
  readonly limit?: number;
  readonly totalCount?: number;
}

/**
 * Strongly-typed cursor paginated list matching backend CursorPagedList<T>.
 */
export interface VKCursorPagedList<T, TCursor = string> {
  readonly items: readonly T[];
  readonly pagination: VKCursorPagination<TCursor>;
}

/**
 * Standard API metadata including trace info, timestamps, and optional pagination.
 */
export interface VKApiMeta {
  readonly traceId?: string;
  readonly timestamp?: string;
  readonly pagination?: VKPagination;
  readonly cursorPagination?: VKCursorPagination;
}

/**
 * Wire-level API error DTO matching backend error serialization.
 */
export interface VKApiErrorDto {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

/**
 * Backwards compatibility alias for VKApiErrorDto.
 */
export type VKApiError = VKApiErrorDto;

/**
 * Maps a wire-level API error DTO into a standardized domain VKError.
 */
export function mapApiErrorDtoToVKError(dto: VKApiErrorDto, type = VKErrorType.Failure): VKError {
  return new VKError(
    dto.code || 'API.Error',
    dto.message || 'An unexpected API error occurred.',
    type,
    dto.details ? { extensions: dto.details } : undefined,
  );
}

/**
 * Standard enterprise API wire response envelope.
 * Used for deserializing full backend envelope payloads.
 */
export interface VKApiResponse<T> {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly errors?: readonly VKError[];
  readonly meta?: VKApiMeta;
}

