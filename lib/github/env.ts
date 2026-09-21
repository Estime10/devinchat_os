function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

/**
 * Credentials OAuth GitHub — server-only.
 */
export function getGithubOAuthEnv() {
  return {
    clientId: requireEnv("GITHUB_CLIENT_ID"),
    clientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
    encryptionKey: requireEnv("GITHUB_CREDENTIALS_ENCRYPTION_KEY"),
  };
}

/**
 * Scopes V1 — OAuth App classique.
 * `repo` est le minimum GitHub pour lire les repos *privés* (pas de scope
 * lecture-seule équivalent). Borne applicative : `githubApiGet` (GET only).
 * Vrai least-privilege → GitHub App (Contents: Read) — hors V1 pyramide.
 */
export const GITHUB_OAUTH_SCOPES = ["read:user", "repo"] as const;
