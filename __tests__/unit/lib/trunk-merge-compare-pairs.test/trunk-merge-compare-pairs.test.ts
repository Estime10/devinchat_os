import { listTrunkMergeComparePairs } from "@/backend/features/04_features/domain/list-trunk-merge-compare-pairs/list-trunk-merge-compare-pairs";
import { describe, expect, it } from "vitest";

describe("listTrunkMergeComparePairs", () => {
  it("reste O(N) : bases trunk × heads seulement", () => {
    const branches = ["main", "develop", "feature/a", "feature/b", "feature/c"];
    const pairs = listTrunkMergeComparePairs(branches);

    // develop×4 + main×4 = 8 (pas 5×4 = 20)
    expect(pairs).toHaveLength(8);
    expect(
      pairs.every((pair) => pair.base === "develop" || pair.base === "main"),
    ).toBe(true);
    expect(pairs.some((pair) => pair.base === "feature/a")).toBe(false);
  });

  it("40 branches → ≤ 78 compares (2 trunks × 39), jamais N²", () => {
    const branches = [
      "main",
      "develop",
      ...Array.from({ length: 38 }, (_, index) => `feature/${index}`),
    ];
    expect(branches).toHaveLength(40);

    const pairs = listTrunkMergeComparePairs(branches);
    const fullMesh = 40 * 39;

    expect(pairs).toHaveLength(78);
    expect(pairs.length).toBeLessThan(fullMesh / 10);
  });

  it("sans develop : uniquement main comme base", () => {
    const pairs = listTrunkMergeComparePairs(["main", "feature/x", "hotfix/y"]);
    expect(pairs).toHaveLength(2);
    expect(pairs.every((pair) => pair.base === "main")).toBe(true);
  });

  it("préfère main à master comme production", () => {
    const pairs = listTrunkMergeComparePairs(["main", "master", "feature/x"]);
    expect(pairs.every((pair) => pair.base === "main")).toBe(true);
    expect(pairs.some((pair) => pair.base === "master")).toBe(false);
  });
});
