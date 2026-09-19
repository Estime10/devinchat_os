import { splitReposByVisibility, type GithubRepo } from "@/lib/github/repos";
import { describe, expect, it } from "vitest";

function repo(
  partial: Partial<GithubRepo> & Pick<GithubRepo, "id" | "isPrivate">,
): GithubRepo {
  return {
    name: partial.name ?? `repo-${partial.id}`,
    fullName: partial.fullName ?? `user/repo-${partial.id}`,
    htmlUrl: partial.htmlUrl ?? `https://github.com/user/repo-${partial.id}`,
    createdAt: partial.createdAt ?? null,
    pushedAt: partial.pushedAt ?? null,
    ...partial,
  };
}

describe("splitReposByVisibility", () => {
  it("sépare private et public", () => {
    const result = splitReposByVisibility([
      repo({ id: 1, isPrivate: true }),
      repo({ id: 2, isPrivate: false }),
      repo({ id: 3, isPrivate: true }),
    ]);

    expect(result.privateRepos.map((item) => item.id)).toEqual([1, 3]);
    expect(result.publicRepos.map((item) => item.id)).toEqual([2]);
  });
});
