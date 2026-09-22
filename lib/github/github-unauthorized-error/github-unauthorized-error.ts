/**
 * Token GitHub rejeté par l’API (401) — connexion à marquer expired.
 */
export class GithubUnauthorizedError extends Error {
  readonly name = "GithubUnauthorizedError";

  constructor() {
    super("GitHub access token is unauthorized");
  }
}

/**
 * True aussi si l’erreur a été sérialisée (unstable_cache / RSC digest)
 * et perd le prototype `instanceof`.
 */
export function isGithubUnauthorizedError(
  error: unknown,
): error is GithubUnauthorizedError {
  if (error instanceof GithubUnauthorizedError) {
    return true;
  }
  if (typeof error !== "object" || error === null) {
    return false;
  }
  if (
    "name" in error &&
    (error as { name: unknown }).name === "GithubUnauthorizedError"
  ) {
    return true;
  }
  return (
    error instanceof Error &&
    error.message === "GitHub access token is unauthorized"
  );
}
