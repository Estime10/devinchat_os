import { isGithubConnectionActive } from "@/backend/features/02_github/domain/is-github-connection-active";
import { resolveGithubOAuthError } from "@/backend/features/02_github/messages/resolve-github-oauth-error";
import { getOwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection";
import {
  listOwnGithubRepos,
  type OwnGithubRepos,
  type OwnGithubReposResult,
} from "@/backend/features/02_github/services/list-own-github-repos";

export type GithubHomescreenData =
  | { kind: "disconnected" }
  | { kind: "unauthorized"; alreadyExpired: boolean }
  | { kind: "error" }
  | { kind: "ok"; repos: OwnGithubRepos };

/**
 * Charge connexion + repos pour le homescreen GitHub.
 * Sparklines : hydratation client (évite un 2e Suspense / remount du board).
 */
export async function loadGithubHomescreen(input: {
  oauthErrorCode?: string;
}): Promise<GithubHomescreenData> {
  const connection = await getOwnGithubConnection();

  if (!isGithubConnectionActive(connection)) {
    return { kind: "disconnected" };
  }

  const result: OwnGithubReposResult = await listOwnGithubRepos();

  if (result.kind === "unauthorized") {
    return {
      kind: "unauthorized",
      alreadyExpired: input.oauthErrorCode === "expired",
    };
  }

  if (result.kind !== "ok") {
    return { kind: "error" };
  }

  return { kind: "ok", repos: result.data };
}

export function githubHomescreenErrorMessage(
  oauthErrorCode?: string,
): string | null {
  return resolveGithubOAuthError(oauthErrorCode);
}
