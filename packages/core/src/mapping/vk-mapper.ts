// [FS-03] [BASE-01] [AP.01] Typed boundary mapper contracts for DTO ↔ Domain model separation
import { vkAssert } from '../assert/index.js';
import { VKResult } from '../result/vk-result.js';
import type { VKPagedResult, VKCursorPagedResult } from '../types/types.types.js';

/**
 * Bidirectional boundary mapper interface decoupling wire DTOs from Domain/View models (FS-03).
 */
export interface VKMapper<TDto, TDomain> {
  /**
   * Maps wire DTO to Domain or View model at the inbound boundary.
   */
  readonly toDomain: (dto: TDto) => TDomain;

  /**
   * Optional reverse mapping from Domain model to wire DTO for outbound requests.
   */
  readonly toDto?: (domain: TDomain) => TDto;
}

/**
 * Creates a strongly typed boundary mapper (FS-03 / AP.01).
 */
export function createVKMapper<TDto, TDomain>(definition: {
  readonly toDomain: (dto: TDto) => TDomain;
  readonly toDto?: (domain: TDomain) => TDto;
}): VKMapper<TDto, TDomain> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(definition, 'definition');
  vkAssert.notNull(definition.toDomain, 'definition.toDomain');

  return {
    toDomain: definition.toDomain,
    ...(definition.toDto ? { toDto: definition.toDto } : {}),
  };
}

/**
 * Maps an array of DTOs into Domain models using either a VKMapper instance or mapping function.
 */
export function vkMapArray<TDto, TDomain>(
  dtos: readonly TDto[],
  mapper: VKMapper<TDto, TDomain> | ((dto: TDto) => TDomain),
): readonly TDomain[] {
  // [AP.01] Boundary assertions
  vkAssert.notNull(dtos, 'dtos');
  vkAssert.notNull(mapper, 'mapper');

  const mapFn = typeof mapper === 'function' ? mapper : (dto: TDto) => mapper.toDomain(dto);
  return dtos.map(mapFn);
}

/**
 * Maps a standard VKPagedResult envelope of DTOs into Domain models while preserving pagination metadata (FS-08).
 */
export function vkMapPagedResult<TDto, TDomain>(
  pagedDto: VKPagedResult<TDto>,
  mapper: VKMapper<TDto, TDomain> | ((dto: TDto) => TDomain),
): VKPagedResult<TDomain> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(pagedDto, 'pagedDto');
  vkAssert.notNull(mapper, 'mapper');

  const mapFn = typeof mapper === 'function' ? mapper : (dto: TDto) => mapper.toDomain(dto);
  return {
    items: pagedDto.items.map(mapFn),
    totalCount: pagedDto.totalCount,
    page: pagedDto.page,
    pageSize: pagedDto.pageSize,
    hasNextPage: pagedDto.hasNextPage,
    hasPreviousPage: pagedDto.hasPreviousPage,
  };
}

/**
 * Maps a standard VKCursorPagedResult envelope of DTOs into Domain models preserving cursor metadata (FS-08).
 */
export function vkMapCursorPagedResult<TDto, TDomain, TCursor = string>(
  cursorPagedDto: VKCursorPagedResult<TDto, TCursor>,
  mapper: VKMapper<TDto, TDomain> | ((dto: TDto) => TDomain),
): VKCursorPagedResult<TDomain, TCursor> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(cursorPagedDto, 'cursorPagedDto');
  vkAssert.notNull(mapper, 'mapper');

  const mapFn = typeof mapper === 'function' ? mapper : (dto: TDto) => mapper.toDomain(dto);
  return {
    items: cursorPagedDto.items.map(mapFn),
    cursor: cursorPagedDto.cursor,
    nextCursor: cursorPagedDto.nextCursor,
    prevCursor: cursorPagedDto.prevCursor,
    hasMore: cursorPagedDto.hasMore,
    totalCount: cursorPagedDto.totalCount,
  };
}

/**
 * Maps the success value of a typed VKResult<TDto> into VKResult<TDomain> (CS.01).
 */
export function vkMapResult<TDto, TDomain>(
  result: VKResult<TDto>,
  mapper: VKMapper<TDto, TDomain> | ((dto: TDto) => TDomain),
): VKResult<TDomain> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(result, 'result');
  vkAssert.notNull(mapper, 'mapper');

  const mapFn = typeof mapper === 'function' ? mapper : (dto: TDto) => mapper.toDomain(dto);
  return VKResult.map(result, mapFn);
}
