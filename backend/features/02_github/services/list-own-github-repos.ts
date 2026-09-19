import { getOwnGithubAccessToken } from "@/backend/features/02_github/services/get-own-github-access-token";
import {
  fetchGithubRepos,
  splitReposByVisibility,
  type GithubRepo,
} from "@/lib/github/repos";

export type OwnGithubRepos = {
  privateRepos: GithubRepo[];
  publicRepos: GithubRepo[];
};

/**
 * Repos GitHub du user connecté — token jamais renvoyé.
 */
export async function listOwnGithubRepos(): Promise<OwnGithubRepos | null> {
  const accessToken = await getOwnGithubAccessToken();
  if (!accessToken) {
    return null;
  }

  const repos = await fetchGithubRepos(accessToken);
  return splitReposByVisibility(repos);
}
