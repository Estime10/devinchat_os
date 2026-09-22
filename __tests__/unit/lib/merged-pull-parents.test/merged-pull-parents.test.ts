import { buildMergedPullParentMap } from "@/lib/github/fetch-merged-pull-parents/fetch-merged-pull-parents";
import { describe, expect, it } from "vitest";

describe("buildMergedPullParentMap", () => {
  it("garde la première base (PR la plus récente) par head", () => {
    const map = buildMergedPullParentMap([
      { head: "feature/auth-ui", base: "feature/auth" },
      { head: "feature/auth-ui", base: "develop" },
      { head: "feature/auth", base: "develop" },
    ]);

    expect(map.get("feature/auth-ui")).toBe("feature/auth");
    expect(map.get("feature/auth")).toBe("develop");
  });

  it("ignore self-merge", () => {
    const map = buildMergedPullParentMap([
      { head: "feature/x", base: "feature/x" },
    ]);
    expect(map.size).toBe(0);
  });
});
