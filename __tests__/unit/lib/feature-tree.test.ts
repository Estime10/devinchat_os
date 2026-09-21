import { resolveMergedIntoBranch } from "@/backend/features/04_features/domain/build-branch-parent-map";
import { buildFeatureTree } from "@/backend/features/04_features/domain/build-feature-tree";
import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { describe, expect, it } from "vitest";

function feature(
  partial: Partial<OwnFeature> &
    Pick<OwnFeature, "id" | "name" | "branchName" | "status">,
): OwnFeature {
  return {
    parentBranchName: null,
    lastPushedAt: null,
    ...partial,
  };
}

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

describe("buildFeatureTree", () => {
  it("main → develop → mergés dans develop (récence)", () => {
    const tree = buildFeatureTree([
      feature({
        id: "1",
        name: "Main",
        branchName: "main",
        status: "done",
      }),
      feature({
        id: "2",
        name: "Develop",
        branchName: "develop",
        parentBranchName: "main",
        status: "in_progress",
      }),
      feature({
        id: "3",
        name: "Done A",
        branchName: "feature/a",
        parentBranchName: "develop",
        status: "done",
        lastPushedAt: "2026-01-02T00:00:00Z",
      }),
      feature({
        id: "4",
        name: "WIP B",
        branchName: "feature/b",
        parentBranchName: null,
        status: "in_progress",
        lastPushedAt: "2026-01-03T00:00:00Z",
      }),
      feature({
        id: "5",
        name: "Done C",
        branchName: "feature/c",
        parentBranchName: "develop",
        status: "done",
        lastPushedAt: "2026-01-04T00:00:00Z",
      }),
    ]);

    expect(tree.root?.feature.branchName).toBe("main");
    expect(tree.root?.children[0]?.feature.branchName).toBe("develop");
    expect(
      tree.root?.children[0]?.children.map((node) => node.feature.branchName),
    ).toEqual(["feature/c", "feature/a"]);
    expect(tree.unattached.map((item) => item.branchName)).toEqual([
      "feature/b",
    ]);
  });

  it("nest les sous-branches sous leur parent_branch_name", () => {
    const tree = buildFeatureTree([
      feature({
        id: "main",
        name: "Main",
        branchName: "main",
        status: "done",
      }),
      feature({
        id: "dev",
        name: "Develop",
        branchName: "develop",
        status: "in_progress",
      }),
      feature({
        id: "auth",
        name: "Auth",
        branchName: "feature/auth",
        parentBranchName: "develop",
        status: "done",
        lastPushedAt: "2026-01-02T00:00:00Z",
      }),
      feature({
        id: "auth-ui",
        name: "Auth UI",
        branchName: "feature/auth-ui",
        parentBranchName: "feature/auth",
        status: "done",
        lastPushedAt: "2026-01-03T00:00:00Z",
      }),
    ]);

    const develop = tree.root?.children[0];
    const auth = develop?.children[0];
    expect(auth?.feature.branchName).toBe("feature/auth");
    expect(auth?.children.map((node) => node.feature.branchName)).toEqual([
      "feature/auth-ui",
    ]);
  });

  it("attache les done sans branche sous leur parent", () => {
    const tree = buildFeatureTree([
      feature({
        id: "dev",
        name: "Develop",
        branchName: "develop",
        status: "in_progress",
      }),
      feature({
        id: "shipped",
        name: "Shipped Auth",
        branchName: null,
        parentBranchName: "develop",
        status: "done",
        lastPushedAt: "2026-01-02T00:00:00Z",
      }),
    ]);

    expect(tree.root?.feature.branchName).toBe("develop");
    expect(tree.root?.children[0]?.feature.name).toBe("Shipped Auth");
    expect(tree.unattached).toHaveLength(0);
  });

  it("place un hotfix mergé dans main à côté de develop", () => {
    const tree = buildFeatureTree([
      feature({
        id: "1",
        name: "Main",
        branchName: "main",
        status: "done",
      }),
      feature({
        id: "2",
        name: "Develop",
        branchName: "develop",
        status: "in_progress",
      }),
      feature({
        id: "3",
        name: "Hotfix",
        branchName: "hotfix/x",
        parentBranchName: "main",
        status: "done",
        lastPushedAt: "2026-01-05T00:00:00Z",
      }),
    ]);

    expect(tree.root?.children.map((node) => node.feature.branchName)).toEqual([
      "develop",
      "hotfix/x",
    ]);
  });
});
