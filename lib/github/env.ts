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

/** Scopes V1 — lecture user + repos (activité privée incluse). */
export const GITHUB_OAUTH_SCOPES = ["read:user", "repo"] as const;
