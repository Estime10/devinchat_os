import type { OwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection";

/**
 * Connexion GitHub utilisable pour les appels API.
 */
export function isGithubConnectionActive(
  connection: OwnGithubConnection | null,
): boolean {
  return connection?.status === "active";
}
