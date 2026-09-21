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

  it("préfère la base PR feature→feature au trunk compare", () => {
    expect(
      resolveMergedIntoBranch({
        branchName: "feature/auth-ui",
        branchNames: ["main", "develop", "feature/auth", "feature/auth-ui"],
        isMergedInto: (base, head) =>
          base === "develop" && head === "feature/auth-ui",
        pullParentByHead: new Map([["feature/auth-ui", "feature/auth"]]),
      }),
    ).toBe("feature/auth");
  });

  it("open→open uniquement via PR mergée (pas de compare inventé)", () => {
    expect(
      resolveMergedIntoBranch({
        branchName: "feature/child",
        branchNames: ["main", "develop", "feature/parent", "feature/child"],
        isMergedInto: () => false,
        pullParentByHead: new Map([["feature/child", "feature/parent"]]),
      }),
    ).toBe("feature/parent");

    expect(
      resolveMergedIntoBranch({
        branchName: "feature/child",
        branchNames: ["main", "develop", "feature/parent", "feature/child"],
        isMergedInto: (base, head) =>
          base === "feature/parent" && head === "feature/child",
        pullParentByHead: new Map(),
      }),
    ).toBe(null);
  });

  it("open sans PR ni trunk → pas de parent", () => {
    expect(
      resolveMergedIntoBranch({
        branchName: "feature/child",
        branchNames: [
          "main",
          "develop",
          "feature/done-parent",
          "feature/child",
        ],
        isMergedInto: (base, head) => {
          if (head === "feature/done-parent") {
            return base === "develop";
          }
          if (head === "feature/child") {
            return base === "feature/done-parent";
          }
          return false;
        },
      }),
    ).toBe(null);
  });

  it("fallback trunk si pas de PR parent", () => {
    expect(
      resolveMergedIntoBranch({
        branchName: "feature/x",
        branchNames: ["main", "develop", "feature/x"],
        isMergedInto: (base, head) =>
          base === "develop" && head === "feature/x",
        pullParentByHead: new Map(),
      }),
    ).toBe("develop");
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
    expect(tree.openForest.map((node) => node.feature.branchName)).toEqual([
      "feature/b",
    ]);
  });

  it("nest open→open avec lignes hors spine", () => {
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
        id: "parent",
        name: "Parent WIP",
        branchName: "feature/parent",
        parentBranchName: null,
        status: "in_progress",
        lastPushedAt: "2026-01-02T00:00:00Z",
      }),
      feature({
        id: "child",
        name: "Child WIP",
        branchName: "feature/child",
        parentBranchName: "feature/parent",
        status: "in_progress",
        lastPushedAt: "2026-01-03T00:00:00Z",
      }),
      feature({
        id: "solo",
        name: "Solo WIP",
        branchName: "feature/solo",
        parentBranchName: null,
        status: "in_progress",
        lastPushedAt: "2026-01-04T00:00:00Z",
      }),
    ]);

    expect(tree.openForest.map((node) => node.feature.branchName)).toEqual([
      "feature/solo",
      "feature/parent",
    ]);
    expect(
      tree.openForest[1]?.children.map((node) => node.feature.branchName),
    ).toEqual(["feature/child"]);
  });

  it("openForest : plus récent en premier même si entrée désordonnée", () => {
    const tree = buildFeatureTree([
      feature({
        id: "1",
        name: "Main",
        branchName: "main",
        status: "done",
      }),
      feature({
        id: "old",
        name: "Old",
        branchName: "feature/old",
        parentBranchName: null,
        status: "in_progress",
        lastPushedAt: "2026-01-01T00:00:00Z",
      }),
      feature({
        id: "new",
        name: "New",
        branchName: "feature/new",
        parentBranchName: null,
        status: "in_progress",
        lastPushedAt: "2026-01-05T00:00:00Z",
      }),
      feature({
        id: "mid",
        name: "Mid",
        branchName: "feature/mid",
        parentBranchName: null,
        status: "in_progress",
        lastPushedAt: "2026-01-03T00:00:00Z",
      }),
    ]);

    expect(tree.openForest.map((node) => node.feature.branchName)).toEqual([
      "feature/new",
      "feature/mid",
      "feature/old",
    ]);
  });

  it("ne perd aucun open même avec cycle parent A↔B", () => {
    const tree = buildFeatureTree([
      feature({
        id: "1",
        name: "Main",
        branchName: "main",
        status: "done",
      }),
      feature({
        id: "a",
        name: "A",
        branchName: "feature/a",
        parentBranchName: "feature/b",
        status: "in_progress",
      }),
      feature({
        id: "b",
        name: "B",
        branchName: "feature/b",
        parentBranchName: "feature/a",
        status: "in_progress",
      }),
    ]);

    const ids = new Set<string>();
    const walk = (node: {
      feature: { id: string };
      children: typeof tree.openForest;
    }) => {
      ids.add(node.feature.id);
      for (const child of node.children) {
        walk(child);
      }
    };
    for (const node of tree.openForest) {
      walk(node);
    }

    expect(ids.has("a")).toBe(true);
    expect(ids.has("b")).toBe(true);
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
    expect(tree.openForest).toHaveLength(0);
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

  it("rattache sous main si parent develop absent du sync", () => {
    const tree = buildFeatureTree([
      feature({
        id: "1",
        name: "Main",
        branchName: "main",
        status: "done",
      }),
      feature({
        id: "3",
        name: "Done A",
        branchName: "feature/a",
        parentBranchName: "develop",
        status: "done",
        lastPushedAt: "2026-01-02T00:00:00Z",
      }),
    ]);

    expect(tree.root?.feature.branchName).toBe("main");
    expect(tree.root?.children.map((node) => node.feature.branchName)).toEqual([
      "feature/a",
    ]);
    expect(tree.root?.children[0]?.feature.parentBranchName).toBe("develop");
    expect(tree.openForest).toHaveLength(0);
  });
});
