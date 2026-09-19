import type { OwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection";

/**
 * Reconnect autorisé si la connexion n’est plus healthy,
 * ou si un forçage explicite (token/fetch KO).
 */
export function canReconnectGithub(
  status: OwnGithubConnection["status"],
  options?: { force?: boolean },
): boolean {
  return options?.force === true || status !== "active";
}
