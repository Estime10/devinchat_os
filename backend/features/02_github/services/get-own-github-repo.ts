import { markOwnGithubConnectionExpired } from "@/backend/features/02_github/services/mark-own-github-connection-expired";
import { getOwnGithubAccessToken } from "@/backend/features/02_github/services/get-own-github-access-token";
import { listOwnGithubRepos } from "@/backend/features/02_github/services/list-own-github-repos";
import { fetchGithubRepo, type GithubRepo } from "@/lib/github/repos";

export type OwnGithubRepoResult =
  | { kind: "ok"; repo: GithubRepo }
  | { kind: "unauthorized" }
  | { kind: "missing" }
  | { kind: "no_access" };

function matchesOwnerRepo(
  fullName: string,
  owner: string,
  repo: string,
): boolean {
  return fullName.toLowerCase() === `${owner}/${repo}`.toLowerCase();
}

/**
 * Repo accessible du user — priorite à la liste déjà sync (évite 401/cache parasite).
 * 401 live → marque connexion expired.
 */
export async function getOwnGithubRepo(
  owner: string,
  repo: string,
): Promise<OwnGithubRepoResult> {
  const ownerName = decodeURIComponent(owner);
  const repoName = decodeURIComponent(repo);

  const listed = await listOwnGithubRepos();

  if (listed.kind === "no_session") {
    return { kind: "no_access" };
  }

  if (listed.kind === "unauthorized") {
    return { kind: "unauthorized" };
  }

  if (listed.kind === "ok") {
    const fromList = [
      ...listed.data.privateRepos,
      ...listed.data.publicRepos,
    ].find((item) => matchesOwnerRepo(item.fullName, ownerName, repoName));
    if (fromList) {
      return { kind: "ok", repo: fromList };
    }
  }

  // Pas dans la liste (cache stale / collab) — fetch direct, sans cache négatif.
  const accessToken = await getOwnGithubAccessToken();
  if (!accessToken) {
    return { kind: "unauthorized" };
  }

  const result = await fetchGithubRepo(accessToken, ownerName, repoName);

  if (result.kind === "unauthorized") {
    await markOwnGithubConnectionExpired();
    return { kind: "unauthorized" };
  }

  if (result.kind === "ok") {
    return { kind: "ok", repo: result.repo };
  }

  return { kind: "missing" };
}
