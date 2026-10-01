export interface VKPagedResponse<T> {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface VKPagedRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

export interface VKCursorPagedResponse<T> {
  readonly items: readonly T[];
  readonly cursor: string | null;
  readonly hasMore: boolean;
}

export interface VKCursorPagedRequest {
  readonly cursor?: string;
  readonly limit: number;
}
