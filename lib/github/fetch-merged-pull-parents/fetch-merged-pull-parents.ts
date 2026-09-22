import { githubApiGet } from "@/lib/github/api-get/api-get";

type GithubPullPayload = {
  merged_at?: string | null;
  head?: { ref?: string };
  base?: { ref?: string };
};

export type MergedPullParent = {
  head: string;
  base: string;
};

/**
 * Construit head → base (1er = PR mergée la plus récente pour ce head).
 */
export function buildMergedPullParentMap(
  pulls: readonly MergedPullParent[],
): Map<string, string> {
  const parents = new Map<string, string>();

  for (const pull of pulls) {
    if (!pull.head || !pull.base || pull.head === pull.base) {
      continue;
    }
    if (!parents.has(pull.head)) {
      parents.set(pull.head, pull.base);
    }
  }

  return parents;
}

/**
 * PRs fermées mergées — parents généalogiques feature→feature sans compares N².
 * GET only · pages bornées (V1).
 */
export async function fetchMergedPullParents(input: {
  accessToken: string;
  owner: string;
  repo: string;
  maxPages?: number;
}): Promise<Map<string, string>> {
  const maxPages = input.maxPages ?? 2;
  const ordered: MergedPullParent[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const url = new URL(
      `https://api.github.com/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/pulls`,
    );
    url.searchParams.set("state", "closed");
    url.searchParams.set("sort", "updated");
    url.searchParams.set("direction", "desc");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const response = await githubApiGet({
      accessToken: input.accessToken,
      url,
      next: {
        revalidate: 60,
        tags: ["github-pulls-fetch"],
      },
    });

    if (!response.ok) {
      break;
    }

    const payload = (await response.json()) as GithubPullPayload[];
    if (!Array.isArray(payload) || payload.length === 0) {
      break;
    }

    for (const pull of payload) {
      if (!pull.merged_at) {
        continue;
      }
      const head = pull.head?.ref;
      const base = pull.base?.ref;
      if (typeof head !== "string" || typeof base !== "string") {
        continue;
      }
      ordered.push({ head, base });
    }

    if (payload.length < 100) {
      break;
    }
  }

  return buildMergedPullParentMap(ordered);
}
