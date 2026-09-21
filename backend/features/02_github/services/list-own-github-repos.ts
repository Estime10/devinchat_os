import { markOwnGithubConnectionExpired } from "@/backend/features/02_github/services/mark-own-github-connection-expired";
import { getOwnGithubAccessToken } from "@/backend/features/02_github/services/get-own-github-access-token";
import {
  fetchGithubRepos,
  splitReposByVisibility,
  type GithubRepo,
} from "@/lib/github/repos";
import { isGithubUnauthorizedError } from "@/lib/github/github-unauthorized-error";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

/** TTL cache liste repos — compromis fraîcheur / appels GitHub. */
export const GITHUB_REPOS_CACHE_REVALIDATE_SECONDS = 60;

export type OwnGithubRepos = {
  privateRepos: GithubRepo[];
  publicRepos: GithubRepo[];
};

export type OwnGithubReposResult =
  | { kind: "ok"; data: OwnGithubRepos }
  | { kind: "unauthorized" }
  | { kind: "error" }
  | { kind: "no_session" };

export function githubReposCacheTag(userId: string): string {
  return `github-repos:${userId}`;
}

/**
 * Repos GitHub du user — token jamais renvoyé.
 * 401 → marque connexion expired.
 * Cache Data (60s) clé = userId → retour `/home` sans re-query GitHub.
 */
export async function listOwnGithubRepos(): Promise<OwnGithubReposResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { kind: "no_session" };
  }

  const accessToken = await getOwnGithubAccessToken();
  if (!accessToken) {
    return { kind: "unauthorized" };
  }

  const loadRepos = unstable_cache(
    async (): Promise<
      | { kind: "ok"; data: OwnGithubRepos }
      | { kind: "error" }
      | { kind: "unauthorized" }
    > => {
      try {
        const repos = await fetchGithubRepos(accessToken);
        return { kind: "ok", data: splitReposByVisibility(repos) };
      } catch (error) {
        if (isGithubUnauthorizedError(error)) {
          // Ne pas throw : Next/Turbopack remonte l’erreur en overlay RSC
          // même si un catch externe la gère. Le status DB expired + redirect
          // court-circuite les hits suivants ; reconnect invalide le tag.
          return { kind: "unauthorized" };
        }
        return { kind: "error" };
      }
    },
    ["own-github-repos", user.id],
    {
      revalidate: GITHUB_REPOS_CACHE_REVALIDATE_SECONDS,
      tags: [githubReposCacheTag(user.id)],
    },
  );

  const result = await loadRepos();
  if (result.kind === "unauthorized") {
    await markOwnGithubConnectionExpired();
    return { kind: "unauthorized" };
  }
  return result;
}
