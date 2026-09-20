import { resolveMergedIntoBranch } from "@/lib/github/build-branch-parent-map";
import { buildFeaturePyramid } from "@/lib/github/build-feature-pyramid";
import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { describe, expect, it } from "vitest";

describe("resolveMergedIntoBranch", () => {
  it("main n’a jamais de cible de merge", () => {
    expect(
      resolveMergedIntoBranch({
        branchName: "main",
        branchNames: ["main", "develop", "B"],
        isMergedInto: () => true,
      }),
    ).toBe(null);
  });

  it("develop → main si mergé", () => {
    expect(
      resolveMergedIntoBranch({
        branchName: "develop",
        branchNames: ["main", "develop"],
        isMergedInto: (base, head) => base === "main" && head === "develop",
      }),
    ).toBe("main");
  });

  it("préfère develop à main comme cible", () => {
    expect(
      resolveMergedIntoBranch({
        branchName: "feature/x",
        branchNames: ["main", "develop", "feature/x"],
        isMergedInto: (base, head) =>
          (base === "develop" || base === "main") && head === "feature/x",
      }),
    ).toBe("develop");
  });

  it("mergé uniquement dans main → main", () => {
    expect(
      resolveMergedIntoBranch({
        branchName: "hotfix/y",
        branchNames: ["main", "develop", "hotfix/y"],
        isMergedInto: (base, head) => base === "main" && head === "hotfix/y",
      }),
    ).toBe("main");
  });
});

describe("buildFeaturePyramid", () => {
  it("sépare main / develop / done / in_progress", () => {
    const features: OwnFeature[] = [
      {
        id: "1",
        name: "Main",
        branchName: "main",
        parentBranchName: null,
        status: "done",
        lastPushedAt: null,
      },
      {
        id: "2",
        name: "Develop",
        branchName: "develop",
        parentBranchName: "main",
        status: "in_progress",
        lastPushedAt: null,
      },
      {
        id: "3",
        name: "Done A",
        branchName: "feature/a",
        parentBranchName: "develop",
        status: "done",
        lastPushedAt: "2026-01-02T00:00:00Z",
      },
      {
        id: "4",
        name: "WIP B",
        branchName: "feature/b",
        parentBranchName: null,
        status: "in_progress",
        lastPushedAt: "2026-01-03T00:00:00Z",
      },
      {
        id: "5",
        name: "Done C",
        branchName: "feature/c",
        parentBranchName: "main",
        status: "done",
        lastPushedAt: "2026-01-04T00:00:00Z",
      },
    ];

    const pyramid = buildFeaturePyramid(features);
    expect(pyramid.done.map((f) => f.branchName)).toEqual([
      "feature/c",
      "feature/a",
    ]);
    expect(pyramid.inProgress.map((f) => f.branchName)).toEqual(["feature/b"]);
    expect(pyramid.develop?.branchName).toBe("develop");
    expect(pyramid.production?.branchName).toBe("main");
  });
});
