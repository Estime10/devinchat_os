import {
  formatFeatureStatusLabel,
  shortCommitSha,
} from "@/backend/features/04_features/domain/format-feature-status-label/format-feature-status-label";
import { describe, expect, it } from "vitest";

describe("shortCommitSha", () => {
  it("tronque un SHA valide à 7 caractères", () => {
    expect(shortCommitSha("A1B2C3D4E5F67890")).toBe("a1b2c3d");
  });

  it("rejette les valeurs invalides", () => {
    expect(shortCommitSha(null)).toBe(null);
    expect(shortCommitSha("")).toBe(null);
    expect(shortCommitSha("zzzzzzz")).toBe(null);
    expect(shortCommitSha("abc")).toBe(null);
  });
});

describe("formatFeatureStatusLabel", () => {
  it("affiche merged pour merged/done", () => {
    expect(formatFeatureStatusLabel({ status: "merged" })).toBe("merged");
    expect(formatFeatureStatusLabel({ status: "done" })).toBe("merged");
  });

  it("affiche commit {sha} pour committed avec tip SHA", () => {
    expect(
      formatFeatureStatusLabel({
        status: "committed",
        tipCommitSha: "deadbeef0123456789",
      }),
    ).toBe("commit deadbee");
  });

  it("reste sur committed sans tip SHA valide", () => {
    expect(formatFeatureStatusLabel({ status: "committed" })).toBe("committed");
    expect(
      formatFeatureStatusLabel({
        status: "committed",
        tipCommitSha: null,
      }),
    ).toBe("committed");
  });
});
