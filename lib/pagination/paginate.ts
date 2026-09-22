export type PaginateResult<T> = {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
};

/**
 * Pagination 1-indexée — slice pure, sans side-effect.
 */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): PaginateResult<T> {
  if (pageSize < 1) {
    throw new Error("pageSize must be >= 1");
  }

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize) as T[],
    page: safePage,
    totalPages,
    totalItems,
  };
}
