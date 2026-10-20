// [FS-08] [AP.01] Structured List Query parameter serialization and parsing contract
import { vkAssert } from '@vk-blocks/core';

export type VKSortDirection = 'asc' | 'desc';

export interface VKSortClause<TField = string> {
  readonly field: TField;
  readonly direction: VKSortDirection;
}

export type VKFilterValue =
  | string
  | number
  | boolean
  | readonly (string | number | boolean)[]
  | null
  | undefined;

export type VKQueryParamValue = string | number | boolean | readonly (string | number | boolean)[];

/**
 * Standard structured list and pagination query specification (FS-08).
 */
export interface VKListQuery<TFilter = Record<string, VKFilterValue>> {
  /**
   * 1-based page index (FS-08).
   */
  readonly page?: number;

  /**
   * Alias for page index.
   */
  readonly pageNumber?: number;

  /**
   * Maximum item limit per page.
   */
  readonly pageSize?: number;

  /**
   * Opaque Keyset / Cursor token for cursor-based pagination (FS-08).
   */
  readonly cursor?: string | null;

  /**
   * Cursor traversal direction ('forward' | 'backward'). Defaults to 'forward'.
   */
  readonly cursorDirection?: 'forward' | 'backward';

  /**
   * Page limit for cursor-based pagination (counterpart or alias to pageSize).
   */
  readonly limit?: number;

  /**
   * Full-text search or keyword query.
   */
  readonly search?: string;

  /**
   * Single-field sort property name.
   */
  readonly sortBy?: string;

  /**
   * Single-field sort direction ('asc' | 'desc'). Defaults to 'asc'.
   */
  readonly sortDirection?: VKSortDirection;

  /**
   * Structured multi-field sorting clauses (e.g. [{ field: 'createdAt', direction: 'desc' }]).
   */
  readonly sorts?: readonly (VKSortClause | string)[];

  /**
   * Structured filter dictionary.
   */
  readonly filters?: TFilter;

  /**
   * Related entities to include in the response (e.g. ['roles', 'permissions']).
   */
  readonly includes?: readonly string[];

  /**
   * Additional parameters not fitting into the standard query fields.
   */
  readonly extraParams?: Readonly<Record<string, VKFilterValue>>;

  /**
   * Permissive index signature for flat query attributes.
   */
  readonly [key: string]: unknown;
}

/**
 * Options customizing how VKListQuery is serialized to HTTP query parameters.
 */
export interface VKListQuerySerializeOptions {
  /**
   * Parameter name for page number. Defaults to 'page'.
   */
  readonly pageParamName?: string;

  /**
   * Parameter name for page size. Defaults to 'pageSize'.
   */
  readonly pageSizeParamName?: string;

  /**
   * Parameter name for cursor. Defaults to 'cursor'.
   */
  readonly cursorParamName?: string;

  /**
   * Parameter name for cursor direction. Defaults to 'cursorDirection'.
   */
  readonly cursorDirectionParamName?: string;

  /**
   * Parameter name for cursor limit. Defaults to 'limit'.
   */
  readonly limitParamName?: string;

  /**
   * Parameter name for search term. Defaults to 'search'.
   */
  readonly searchParamName?: string;

  /**
   * Parameter name for sort criteria. Defaults to 'sort'.
   */
  readonly sortParamName?: string;

  /**
   * Formatting convention for multi-sort:
   * - 'repeated': sort=field:asc&sort=other:desc
   * - 'comma': sort=field:asc,other:desc
   * Defaults to 'repeated'.
   */
  readonly sortFormat?: 'repeated' | 'comma';

  /**
   * Parameter name for included associations. Defaults to 'include'.
   */
  readonly includesParamName?: string;

  /**
   * Formatting convention for includes:
   * - 'comma': include=a,b
   * - 'repeated': include=a&include=b
   * Defaults to 'comma'.
   */
  readonly includesFormat?: 'comma' | 'repeated';

  /**
   * Filter serialization style:
   * - 'flat': { status: 'active' } -> status=active
   * - 'prefix': { status: 'active' } -> filter.status=active
   * Defaults to 'flat'.
   */
  readonly filterStyle?: 'flat' | 'prefix';

  /**
   * Filter prefix when filterStyle is 'prefix'. Defaults to 'filter.'.
   */
  readonly filterPrefix?: string;
}

/**
 * Type guard testing if an arbitrary object conforms to VKListQuery shape.
 */
export function isVKListQuery(value: unknown): value is VKListQuery {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    (typeof obj.filters === 'object' && obj.filters !== null) ||
    Array.isArray(obj.sorts) ||
    Array.isArray(obj.includes) ||
    (typeof obj.extraParams === 'object' && obj.extraParams !== null) ||
    'pageNumber' in obj ||
    'cursor' in obj ||
    'limit' in obj ||
    ('sortBy' in obj && 'sortDirection' in obj)
  );
}

/**
 * Standard alias for isVKListQuery conforming to VK naming convention.
 */
export const vkIsListQuery = isVKListQuery;

/**
 * Serializes a structured VKListQuery into HTTP query parameter dictionary (FS-08 / AP.01).
 */
export function vkSerializeListQuery(
  query: VKListQuery,
  options?: VKListQuerySerializeOptions,
): Record<string, VKQueryParamValue> {
  // [AP.01] Boundary assertions
  vkAssert.notNull(query, 'query');

  const {
    pageParamName = 'page',
    pageSizeParamName = 'pageSize',
    cursorParamName = 'cursor',
    cursorDirectionParamName = 'cursorDirection',
    limitParamName = 'limit',
    searchParamName = 'search',
    sortParamName = 'sort',
    sortFormat = 'repeated',
    includesParamName = 'include',
    includesFormat = 'comma',
    filterStyle = 'flat',
    filterPrefix = 'filter.',
  } = options ?? {};

  const result: Record<string, VKQueryParamValue> = {};

  // 1. Pagination (page / pageNumber)
  const page = query.page ?? query.pageNumber;
  if (page !== undefined && page !== null) {
    result[pageParamName] = page;
  }
  if (query.pageSize !== undefined && query.pageSize !== null) {
    result[pageSizeParamName] = query.pageSize;
  }

  // 1b. Cursor Pagination (cursor / cursorDirection / limit)
  if (query.cursor !== undefined && query.cursor !== null && query.cursor.trim().length > 0) {
    result[cursorParamName] = query.cursor.trim();
  }
  if (query.cursorDirection !== undefined && query.cursorDirection !== null) {
    result[cursorDirectionParamName] = query.cursorDirection;
  }
  if (query.limit !== undefined && query.limit !== null) {
    result[limitParamName] = query.limit;
  }

  // 2. Search
  if (query.search !== undefined && query.search !== null && query.search.trim().length > 0) {
    result[searchParamName] = query.search.trim();
  }

  // 3. Sorting
  if (query.sorts && query.sorts.length > 0) {
    const formattedSorts = query.sorts.map((s) => {
      if (typeof s === 'string') {
        return s;
      }
      return `${s.field}:${s.direction}`;
    });

    if (sortFormat === 'comma') {
      result[sortParamName] = formattedSorts.join(',');
    } else {
      result[sortParamName] = formattedSorts;
    }
  } else if (query.sortBy) {
    const dir = query.sortDirection ?? 'asc';
    result[sortParamName] = `${query.sortBy}:${dir}`;
  }

  // 4. Includes
  if (query.includes && query.includes.length > 0) {
    const validIncludes = query.includes.filter((inc) => inc.trim().length > 0);
    if (validIncludes.length > 0) {
      if (includesFormat === 'comma') {
        result[includesParamName] = validIncludes.join(',');
      } else {
        result[includesParamName] = validIncludes;
      }
    }
  }

  // 5. Filters
  if (query.filters && typeof query.filters === 'object') {
    for (const [key, val] of Object.entries(query.filters)) {
      if (val === undefined || val === null) {
        continue;
      }
      const paramKey = filterStyle === 'prefix' ? `${filterPrefix}${key}` : key;
      result[paramKey] = val as VKQueryParamValue;
    }
  }

  // 6. Extra params
  if (query.extraParams) {
    for (const [key, val] of Object.entries(query.extraParams)) {
      if (val !== undefined && val !== null && !(key in result)) {
        result[key] = val;
      }
    }
  }

  // 7. Any additional top-level properties
  const reservedKeys = new Set([
    'page',
    'pageNumber',
    'pageSize',
    'cursor',
    'cursorDirection',
    'limit',
    'search',
    'sortBy',
    'sortDirection',
    'sorts',
    'filters',
    'includes',
    'extraParams',
  ]);

  for (const [key, val] of Object.entries(query)) {
    if (!reservedKeys.has(key) && val !== undefined && val !== null && !(key in result)) {
      if (
        typeof val === 'string' ||
        typeof val === 'number' ||
        typeof val === 'boolean' ||
        Array.isArray(val)
      ) {
        result[key] = val as VKQueryParamValue;
      }
    }
  }

  return result;
}

/**
 * Parses URLSearchParams or query string into a structured VKListQuery (FS-08).
 */
export function vkParseListQuery(
  input: URLSearchParams | string,
  options?: VKListQuerySerializeOptions,
): VKListQuery {
  // [AP.01] Boundary assertions
  vkAssert.notNull(input, 'input');

  const {
    pageParamName = 'page',
    pageSizeParamName = 'pageSize',
    cursorParamName = 'cursor',
    cursorDirectionParamName = 'cursorDirection',
    limitParamName = 'limit',
    searchParamName = 'search',
    sortParamName = 'sort',
    includesParamName = 'include',
    filterStyle = 'flat',
    filterPrefix = 'filter.',
  } = options ?? {};

  const searchParams =
    typeof input === 'string'
      ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input)
      : input;

  const result: {
    page?: number;
    pageSize?: number;
    cursor?: string;
    cursorDirection?: 'forward' | 'backward';
    limit?: number;
    search?: string;
    sorts?: VKSortClause[];
    filters: Record<string, VKFilterValue>;
    includes?: string[];
  } = {
    filters: {},
  };

  const rawPage = searchParams.get(pageParamName);
  if (rawPage !== null) {
    const parsed = parseInt(rawPage, 10);
    if (!Number.isNaN(parsed)) {
      result.page = parsed;
    }
  }

  const rawPageSize = searchParams.get(pageSizeParamName);
  if (rawPageSize !== null) {
    const parsed = parseInt(rawPageSize, 10);
    if (!Number.isNaN(parsed)) {
      result.pageSize = parsed;
    }
  }

  const rawCursor = searchParams.get(cursorParamName);
  if (rawCursor !== null && rawCursor.trim().length > 0) {
    result.cursor = rawCursor.trim();
  }

  const rawCursorDirection = searchParams.get(cursorDirectionParamName);
  if (rawCursorDirection === 'forward' || rawCursorDirection === 'backward') {
    result.cursorDirection = rawCursorDirection;
  }

  const rawLimit = searchParams.get(limitParamName);
  if (rawLimit !== null) {
    const parsed = parseInt(rawLimit, 10);
    if (!Number.isNaN(parsed)) {
      result.limit = parsed;
    }
  }

  const rawSearch = searchParams.get(searchParamName);
  if (rawSearch !== null && rawSearch.trim().length > 0) {
    result.search = rawSearch.trim();
  }

  // Sort clauses
  const rawSorts = searchParams.getAll(sortParamName);
  if (rawSorts.length > 0) {
    const clauses: VKSortClause[] = [];
    for (const raw of rawSorts) {
      for (const part of raw.split(',')) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const [field, dir] = trimmed.split(':');
        const direction: VKSortDirection = dir?.toLowerCase() === 'desc' ? 'desc' : 'asc';
        clauses.push({ field: field ?? trimmed, direction });
      }
    }
    if (clauses.length > 0) {
      result.sorts = clauses;
    }
  }

  // Includes
  const rawIncludes = searchParams.getAll(includesParamName);
  if (rawIncludes.length > 0) {
    const incs: string[] = [];
    for (const raw of rawIncludes) {
      for (const part of raw.split(',')) {
        const trimmed = part.trim();
        if (trimmed && !incs.includes(trimmed)) {
          incs.push(trimmed);
        }
      }
    }
    if (incs.length > 0) {
      result.includes = incs;
    }
  }

  // Filters and other parameters
  const standardKeys = new Set([
    pageParamName,
    pageSizeParamName,
    cursorParamName,
    cursorDirectionParamName,
    limitParamName,
    searchParamName,
    sortParamName,
    includesParamName,
  ]);

  for (const [key, value] of searchParams.entries()) {
    if (standardKeys.has(key)) {
      continue;
    }
    if (filterStyle === 'prefix' && key.startsWith(filterPrefix)) {
      const filterKey = key.slice(filterPrefix.length);
      result.filters[filterKey] = value;
    } else if (filterStyle === 'flat') {
      result.filters[key] = value;
    }
  }

  return {
    ...(result.page !== undefined ? { page: result.page, pageNumber: result.page } : {}),
    ...(result.pageSize !== undefined ? { pageSize: result.pageSize } : {}),
    ...(result.cursor !== undefined ? { cursor: result.cursor } : {}),
    ...(result.cursorDirection !== undefined ? { cursorDirection: result.cursorDirection } : {}),
    ...(result.limit !== undefined ? { limit: result.limit } : {}),
    ...(result.search !== undefined ? { search: result.search } : {}),
    ...(result.sorts !== undefined ? { sorts: result.sorts } : {}),
    ...(result.includes !== undefined ? { includes: result.includes } : {}),
    filters: result.filters,
  };
}
