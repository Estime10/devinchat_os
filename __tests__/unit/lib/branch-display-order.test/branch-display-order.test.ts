import { compareByBranchPushOrder } from "@/backend/features/04_features/domain/branch-display-order/branch-display-order";
import { describe, expect, it } from "vitest";

describe("compareByBranchPushOrder", () => {
  it("place main puis develop avant les autres", () => {
    const items = [
      { branchName: "feature/z", lastPushedAt: "2026-01-03T00:00:00Z" },
      { branchName: "develop", lastPushedAt: "2026-01-02T00:00:00Z" },
      { branchName: "main", lastPushedAt: "2026-01-01T00:00:00Z" },
      { branchName: "feature/a", lastPushedAt: "2026-01-04T00:00:00Z" },
    ];

    const sorted = [...items].sort(compareByBranchPushOrder);
    expect(sorted.map((item) => item.branchName)).toEqual([
      "main",
      "develop",
      "feature/a",
      "feature/z",
    ]);
  });
});
