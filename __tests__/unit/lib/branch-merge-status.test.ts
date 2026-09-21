import {
  isHeadMergedIntoBase,
  isHeadStrictlyMergedIntoBase,
} from "@/lib/github/is-branch-merged-into";
import {
  pickProductionBranch,
  resolveBranchFeatureStatus,
} from "@/backend/features/04_features/domain/resolve-branch-feature-status";
import { describe, expect, it } from "vitest";

describe("isHeadMergedIntoBase", () => {
  it("true si ahead_by = 0", () => {
    expect(isHeadMergedIntoBase(0)).toBe(true);
  });

  it("false si la branche a des commits hors base", () => {
    expect(isHeadMergedIntoBase(3)).toBe(false);
  });
});

describe("isHeadStrictlyMergedIntoBase", () => {
  it("true si status behind", () => {
    expect(
      isHeadStrictlyMergedIntoBase({
        aheadBy: 0,
        behindBy: 2,
        status: "behind",
      }),
    ).toBe(true);
  });

  it("false pour identical / ancêtre ambigu", () => {
    expect(
      isHeadStrictlyMergedIntoBase({
        aheadBy: 0,
        behindBy: 0,
        status: "identical",
      }),
    ).toBe(false);
  });

  it("fallback ahead 0 + behind > 0", () => {
    expect(isHeadStrictlyMergedIntoBase({ aheadBy: 0, behindBy: 3 })).toBe(
      true,
    );
    expect(isHeadStrictlyMergedIntoBase({ aheadBy: 0, behindBy: 0 })).toBe(
      false,
    );
  });
});

describe("pickProductionBranch", () => {
  it("préfère main à master", () => {
    expect(pickProductionBranch(new Set(["master", "main"]))).toBe("main");
    expect(pickProductionBranch(new Set(["master"]))).toBe("master");
    expect(pickProductionBranch(new Set(["develop"]))).toBe(null);
  });
});

describe("resolveBranchFeatureStatus", () => {
  it("develop reste toujours in_progress", () => {
    expect(
      resolveBranchFeatureStatus({
        branchName: "develop",
        mergedIntoDevelop: true,
        mergedIntoProduction: true,
        developMergedIntoProduction: true,
      }),
    ).toBe("in_progress");
  });

  it("main/master done seulement si develop y est mergé", () => {
    expect(
      resolveBranchFeatureStatus({
        branchName: "main",
        mergedIntoDevelop: null,
        mergedIntoProduction: null,
        developMergedIntoProduction: true,
      }),
    ).toBe("done");
    expect(
      resolveBranchFeatureStatus({
        branchName: "master",
        mergedIntoDevelop: null,
        mergedIntoProduction: null,
        developMergedIntoProduction: false,
      }),
    ).toBe("in_progress");
  });

  it("autres branches done si mergées dans develop ou main", () => {
    expect(
      resolveBranchFeatureStatus({
        branchName: "feature/auth",
        mergedIntoDevelop: true,
        mergedIntoProduction: false,
        developMergedIntoProduction: false,
      }),
    ).toBe("done");
    expect(
      resolveBranchFeatureStatus({
        branchName: "hotfix/x",
        mergedIntoDevelop: false,
        mergedIntoProduction: true,
        developMergedIntoProduction: false,
      }),
    ).toBe("done");
    expect(
      resolveBranchFeatureStatus({
        branchName: "feature/auth",
        mergedIntoDevelop: false,
        mergedIntoProduction: false,
        developMergedIntoProduction: true,
      }),
    ).toBe("in_progress");
  });
});
