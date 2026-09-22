/**
 * Libellé statut feature pour l’UI.
 * - merged → « merged »
 * - committed + tip SHA → « commit a1b2c3d »
 * - sinon → statut brut (underscores → espaces)
 */
export function formatFeatureStatusLabel(input: {
  status: string;
  tipCommitSha?: string | null;
}): string {
  if (input.status === "merged" || input.status === "done") {
    return "merged";
  }

  if (input.status === "committed") {
    const shortSha = shortCommitSha(input.tipCommitSha);
    if (shortSha) {
      return `commit ${shortSha}`;
    }
  }

  return input.status.replaceAll("_", " ");
}

export function shortCommitSha(sha: string | null | undefined): string | null {
  if (typeof sha !== "string") {
    return null;
  }
  const trimmed = sha.trim();
  if (!/^[0-9a-f]{7,40}$/i.test(trimmed)) {
    return null;
  }
  return trimmed.slice(0, 7).toLowerCase();
}
