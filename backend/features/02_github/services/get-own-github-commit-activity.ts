import { getOwnGithubAccessToken } from "@/backend/features/02_github/services/get-own-github-access-token";
import { listOwnGithubRepos } from "@/backend/features/02_github/services/list-own-github-repos";
import {
  fetchGithubCommitActivity,
  parseGithubFullName,
} from "@/lib/github/commit-activity";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_REPOS_PER_REQUEST = 12;
const ACTIVITY_CACHE_REVALIDATE_SECONDS = 60;

export type GithubCommitActivityMap = Record<string, number[] | null>;

export function githubCommitActivityCacheTag(userId: string): string {
  return `github-commit-activity:${userId}`;
}

/**
 * Tendances commits — whitelist repos du user + cache 60s.
 */
export async function getOwnGithubCommitActivity(
  fullNames: string[],
): Promise<GithubCommitActivityMap> {
  const requested = fullNames
    .filter((name) => typeof name === "string" && name.length > 0)
    .slice(0, MAX_REPOS_PER_REQUEST);

  if (requested.length === 0) {
    return {};
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {};
  }

  const accessToken = await getOwnGithubAccessToken();
  if (!accessToken) {
    return {};
  }

  const owned = await listOwnGithubRepos();
  if (owned.kind !== "ok") {
    return {};
  }

  const allowed = new Set([
    ...owned.data.privateRepos.map((repo) => repo.fullName),
    ...owned.data.publicRepos.map((repo) => repo.fullName),
  ]);

  const allowedNames = requested.filter((name) => allowed.has(name));
  if (allowedNames.length === 0) {
    return {};
  }

  const cacheKey = [...allowedNames].sort().join("|");

  const load = unstable_cache(
    async () => {
      const entries = await Promise.all(
        allowedNames.map(async (fullName) => {
          const parsed = parseGithubFullName(fullName);
          if (!parsed) {
            return [fullName, null] as const;
          }

          const weeks = await fetchGithubCommitActivity({
            accessToken,
            owner: parsed.owner,
            repo: parsed.repo,
          });

          return [fullName, weeks] as const;
        }),
      );

      return Object.fromEntries(entries) as GithubCommitActivityMap;
    },
    ["own-github-commit-activity", user.id, cacheKey],
    {
      revalidate: ACTIVITY_CACHE_REVALIDATE_SECONDS,
      tags: [githubCommitActivityCacheTag(user.id)],
    },
  );

  return load();
}
