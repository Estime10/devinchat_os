import { resolveStaleFeatureUpdate } from "@/backend/features/04_features/domain/resolve-stale-feature-update/resolve-stale-feature-update";
import { describe, expect, it } from "vitest";

describe("resolveStaleFeatureUpdate", () => {
  it("préserve merged : nullifie la branche seulement", () => {
    expect(
      resolveStaleFeatureUpdate({ status: "merged", manualOverride: false }),
    ).toEqual({ branch_name: null });
  });

  it("préserve legacy done comme historique", () => {
    expect(
      resolveStaleFeatureUpdate({ status: "done", manualOverride: false }),
    ).toEqual({ branch_name: null });
  });

  it("archive committed", () => {
    expect(
      resolveStaleFeatureUpdate({
        status: "committed",
        manualOverride: false,
      }),
    ).toEqual({ branch_name: null, status: "archived" });
  });

  it("respecte manual_override", () => {
    expect(
      resolveStaleFeatureUpdate({ status: "merged", manualOverride: true }),
    ).toBe(null);
    expect(
      resolveStaleFeatureUpdate({
        status: "committed",
        manualOverride: true,
      }),
    ).toBe(null);
  });
});
