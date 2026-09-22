import {
  extractRecentWeeklyTotals,
  parseGithubFullName,
} from "@/lib/github/commit-activity/commit-activity";
import { describe, expect, it } from "vitest";

describe("extractRecentWeeklyTotals", () => {
  it("prend les N dernières semaines et pad à gauche", () => {
    const weeks = [{ total: 1 }, { total: 2 }, { total: 3 }, { total: 4 }];
    expect(extractRecentWeeklyTotals(weeks, 6)).toEqual([0, 0, 1, 2, 3, 4]);
    expect(extractRecentWeeklyTotals(weeks, 2)).toEqual([3, 4]);
  });
});

describe("parseGithubFullName", () => {
  it("parse owner/repo", () => {
    expect(parseGithubFullName("acme/app")).toEqual({
      owner: "acme",
      repo: "app",
    });
  });

  it("refuse les noms invalides", () => {
    expect(parseGithubFullName("only")).toBeNull();
    expect(parseGithubFullName("a/b/c")).toBeNull();
  });
});
