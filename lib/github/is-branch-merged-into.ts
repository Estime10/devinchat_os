import { githubApiGet } from "@/lib/github/api-get";

/**
 * True si head n’a aucun commit hors de base (contenu dans base = mergé).
 */
export function isHeadMergedIntoBase(aheadBy: number): boolean {
  return aheadBy <= 0;
}

type GithubComparePayload = {
  ahead_by?: number;
  status?: string;
};

/**
 * Compare GitHub `base...head` — null si base absente / erreur.
 */
export async function fetchIsBranchMergedInto(input: {
  accessToken: string;
  owner: string;
  repo: string;
  base: string;
  head: string;
}): Promise<boolean | null> {
  const url = `https://api.github.com/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/compare/${encodeURIComponent(input.base)}...${encodeURIComponent(input.head)}`;

  const response = await githubApiGet({
    accessToken: input.accessToken,
    url,
    next: {
      revalidate: 60,
      tags: ["github-compare-fetch"],
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GithubComparePayload;
  if (typeof payload.ahead_by !== "number") {
    return null;
  }

  return isHeadMergedIntoBase(payload.ahead_by);
}
