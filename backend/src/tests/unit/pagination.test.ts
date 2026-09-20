import { describe, it, expect } from "vitest";
import { getSkipTake, buildPaginatedResult } from "../../lib/pagination.js";

describe("getSkipTake", () => {
  it("computes skip/take for page 1", () => {
    expect(getSkipTake({ page: 1, limit: 20 })).toEqual({ skip: 0, take: 20 });
  });

  it("computes skip/take for later pages", () => {
    expect(getSkipTake({ page: 3, limit: 10 })).toEqual({ skip: 20, take: 10 });
  });
});

describe("buildPaginatedResult", () => {
  it("reports hasNextPage/hasPreviousPage correctly in the middle", () => {
    const result = buildPaginatedResult([1, 2, 3], 25, { page: 2, limit: 10 });

    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true
    });
  });

  it("has no previous page on page 1", () => {
    const result = buildPaginatedResult([], 5, { page: 1, limit: 10 });

    expect(result.meta.hasPreviousPage).toBe(false);
    expect(result.meta.hasNextPage).toBe(false);
  });

  it("never reports fewer than 1 total page, even with zero items", () => {
    const result = buildPaginatedResult([], 0, { page: 1, limit: 10 });

    expect(result.meta.totalPages).toBe(1);
  });
});
