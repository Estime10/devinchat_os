import { githubApiGet } from "@/lib/github/api-get";

type GithubComparePayload = {
  ahead_by?: number;
  behind_by?: number;
  status?: string;
};

/**
 * Trunk : head contenu dans base (ahead_by ≤ 0), y compris identical.
 */
export function isHeadMergedIntoBase(aheadBy: number): boolean {
  return aheadBy <= 0;
}

/**
 * Open→open : head strictement derrière base (merge réel, pas simple ancêtre).
 */
export function isHeadStrictlyMergedIntoBase(input: {
  aheadBy: number;
  behindBy?: number;
  status?: string;
}): boolean {
  if (input.status === "behind") {
    return true;
  }
  if (
    input.status === "identical" ||
    input.status === "ahead" ||
    input.status === "diverged"
  ) {
    return false;
  }
  return input.aheadBy <= 0 && (input.behindBy ?? 0) > 0;
}

/**
 * Compare GitHub `base...head` — null si base absente / erreur.
 */
export async function fetchIsBranchMergedInto(input: {
  accessToken: string;
  owner: string;
  repo: string;
  base: string;
  head: string;
  /** strict = open→open (status behind). loose = trunk (ahead_by ≤ 0). */
  mode?: "loose" | "strict";
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

  if (input.mode === "strict") {
    return isHeadStrictlyMergedIntoBase({
      aheadBy: payload.ahead_by,
      behindBy:
        typeof payload.behind_by === "number" ? payload.behind_by : undefined,
      status: typeof payload.status === "string" ? payload.status : undefined,
    });
  }

  return isHeadMergedIntoBase(payload.ahead_by);
}
