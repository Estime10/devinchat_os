export const COMMIT_ACTIVITY_WEEKS = 12;

type GithubCommitWeek = {
  total?: number;
  week?: number;
  days?: number[];
};

/**
 * Extrait les totaux des N dernières semaines (ordre chrono croissant).
 */
export function extractRecentWeeklyTotals(
  weeks: GithubCommitWeek[],
  count: number = COMMIT_ACTIVITY_WEEKS,
): number[] {
  const totals = weeks
    .map((week) => (typeof week.total === "number" ? week.total : 0))
    .slice(-count);

  while (totals.length < count) {
    totals.unshift(0);
  }

  return totals;
}

/**
 * Stats commit_activity GitHub — peut répondre 202 le temps du calcul.
 */
export async function fetchGithubCommitActivity(input: {
  accessToken: string;
  owner: string;
  repo: string;
}): Promise<number[] | null> {
  const url = `https://api.github.com/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/stats/commit_activity`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${input.accessToken}`,
        "User-Agent": "devinchat-os",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (response.status === 202) {
      await new Promise((resolve) => {
        setTimeout(resolve, 800);
      });
      continue;
    }

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return null;
    }

    return extractRecentWeeklyTotals(payload as GithubCommitWeek[]);
  }

  return null;
}

export function parseGithubFullName(
  fullName: string,
): { owner: string; repo: string } | null {
  const [owner, repo, ...rest] = fullName.split("/");
  if (!owner || !repo || rest.length > 0) {
    return null;
  }
  return { owner, repo };
}
