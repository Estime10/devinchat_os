import { resolveStaleFeatureUpdate } from "@/backend/features/04_features/domain/resolve-stale-feature-update";
import { describe, expect, it } from "vitest";

describe("resolveStaleFeatureUpdate", () => {
  it("préserve done : nullifie la branche seulement", () => {
    expect(
      resolveStaleFeatureUpdate({ status: "done", manualOverride: false }),
    ).toEqual({ branch_name: null });
  });

  it("archive in_progress", () => {
    expect(
      resolveStaleFeatureUpdate({
        status: "in_progress",
        manualOverride: false,
      }),
    ).toEqual({ branch_name: null, status: "archived" });
  });

  it("respecte manual_override", () => {
    expect(
      resolveStaleFeatureUpdate({ status: "done", manualOverride: true }),
    ).toBe(null);
    expect(
      resolveStaleFeatureUpdate({
        status: "in_progress",
        manualOverride: true,
      }),
    ).toBe(null);
  });
});
