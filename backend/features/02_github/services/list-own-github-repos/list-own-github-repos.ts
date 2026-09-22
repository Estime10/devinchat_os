import { markOwnGithubConnectionExpired } from "@/backend/features/02_github/services/mark-own-github-connection-expired/mark-own-github-connection-expired";
import { getOwnGithubAccessToken } from "@/backend/features/02_github/services/get-own-github-access-token/get-own-github-access-token";
import {
  fetchGithubRepos,
  splitReposByVisibility,
  type GithubRepo,
} from "@/lib/github/repos/repos";
import { isGithubUnauthorizedError } from "@/lib/github/github-unauthorized-error/github-unauthorized-error";
import { getSupabaseAdminEnv } from "@/lib/supabase/env/env";
import { createClient } from "@/lib/supabase/server/server";
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
 * Empreinte courte du token — invalide le cache Data quand OAuth renouvelle
 * le secret (évite de resservir un snapshot `unauthorized` post-reconnect).
 */
function accessTokenCacheKey(accessToken: string): string {
  return accessToken.slice(-12);
}

/**
 * Repos GitHub du user — token jamais renvoyé.
 * 401 → marque connexion expired.
 * Cache Data : uniquement les succès (jamais unauthorized/error).
 */
export async function listOwnGithubRepos(): Promise<OwnGithubReposResult> {
  if (!getSupabaseAdminEnv()) {
    return { kind: "error" };
  }

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
    async (token: string) =>
      fetchGithubRepos(token).then(splitReposByVisibility),
    ["own-github-repos", user.id, accessTokenCacheKey(accessToken)],
    {
      revalidate: GITHUB_REPOS_CACHE_REVALIDATE_SECONDS,
      tags: [githubReposCacheTag(user.id)],
    },
  );

  try {
    const data = await loadRepos(accessToken);
    return { kind: "ok", data };
  } catch (error) {
    if (isGithubUnauthorizedError(error)) {
      await markOwnGithubConnectionExpired();
      return { kind: "unauthorized" };
    }
    return { kind: "error" };
  }
}
