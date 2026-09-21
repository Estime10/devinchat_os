import { featureNameFromBranch } from "@/backend/features/04_features/domain/feature-branch";
import { describe, expect, it } from "vitest";

describe("featureNameFromBranch", () => {
  it("transforme feature/authentication en Authentication", () => {
    expect(featureNameFromBranch("feature/authentication")).toBe(
      "Authentication",
    );
  });

  it("transforme feature/authentication-ui en Authentication UI", () => {
    expect(featureNameFromBranch("feature/authentication-ui")).toBe(
      "Authentication UI",
    );
  });

  it("transforme main et develop", () => {
    expect(featureNameFromBranch("main")).toBe("Main");
    expect(featureNameFromBranch("develop")).toBe("Develop");
  });
});
