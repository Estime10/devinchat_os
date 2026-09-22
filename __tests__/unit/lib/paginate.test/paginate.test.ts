import { paginate } from "@/lib/pagination/paginate";
import { describe, expect, it } from "vitest";

describe("paginate", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("découpe une page 1-indexée", () => {
    expect(paginate(items, 1, 4)).toEqual({
      items: [1, 2, 3, 4],
      page: 1,
      totalPages: 3,
      totalItems: 10,
    });
    expect(paginate(items, 3, 4).items).toEqual([9, 10]);
  });

  it("borne la page hors limites", () => {
    expect(paginate(items, 0, 4).page).toBe(1);
    expect(paginate(items, 99, 4).page).toBe(3);
  });

  it("liste vide → une page vide", () => {
    expect(paginate([], 1, 8)).toEqual({
      items: [],
      page: 1,
      totalPages: 1,
      totalItems: 0,
    });
  });
});
