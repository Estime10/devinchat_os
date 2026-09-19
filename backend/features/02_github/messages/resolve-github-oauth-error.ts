const GITHUB_OAUTH_ERROR_MESSAGES: Record<string, string> = {
  config: "GitHub OAuth is not configured on the server.",
  denied: "GitHub authorization was denied.",
  state: "OAuth state mismatch. Try connecting again.",
  conflict: "That GitHub account is already linked to another user.",
  persist: "Could not save the GitHub connection. Try again.",
  exchange: "GitHub token exchange failed. Try again.",
};

/**
 * Mappe un code d’erreur OAuth query → message UI (sans secrets).
 */
export function resolveGithubOAuthError(code?: string): string | null {
  if (!code) {
    return null;
  }

  return GITHUB_OAUTH_ERROR_MESSAGES[code] ?? "GitHub connection failed.";
}
