/**
 * Token GitHub rejeté par l’API (401) — connexion à marquer expired.
 */
export class GithubUnauthorizedError extends Error {
  readonly name = "GithubUnauthorizedError";

  constructor() {
    super("GitHub access token is unauthorized");
  }
}

export function isGithubUnauthorizedError(
  error: unknown,
): error is GithubUnauthorizedError {
  return error instanceof GithubUnauthorizedError;
}
