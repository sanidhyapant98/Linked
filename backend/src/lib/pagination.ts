export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function getSkipTake({ page = 1, limit = 20 }: Partial<PaginationParams>) {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const safeLimit =
    Number.isFinite(limit) && limit >= 1 ? Math.min(Math.floor(limit), 100) : 20;
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  totalItems: number,
  { page, limit }: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

  return {
    data,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
}
