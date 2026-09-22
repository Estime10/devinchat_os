const GITHUB_OAUTH_ERROR_MESSAGES: Record<string, string> = {
  config: "GitHub isn’t configured on this server yet.",
  denied: "GitHub access was denied. Nothing was linked.",
  state: "That sign-in link expired. Try connecting again.",
  conflict: "That GitHub account is already linked to another user.",
  persist: "Couldn’t save the GitHub connection. Try again.",
  exchange: "GitHub sign-in failed. Try again.",
  expired: "Your GitHub session ended. Connect again to keep syncing.",
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
