import { getOwnGithubAccessToken } from "@/backend/features/02_github/services/get-own-github-access-token";
import { listOwnGithubRepos } from "@/backend/features/02_github/services/list-own-github-repos";
import type { GithubCommitActivityMap } from "@/backend/features/02_github/types/github-commit-activity-map";
import {
  fetchGithubCommitActivity,
  parseGithubFullName,
} from "@/lib/github/commit-activity";
import { createClient } from "@/lib/supabase/server";

const MAX_REPOS_PER_REQUEST = 12;

export type { GithubCommitActivityMap };

export function githubCommitActivityCacheTag(userId: string): string {
  return `github-commit-activity:${userId}`;
}

/**
 * Tendances commits — whitelist repos du user.
 * Pas de unstable_cache : un push doit pouvoir se refléter au prochain chargement
 * (GitHub stats peut quand même laguer côté API).
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
}
