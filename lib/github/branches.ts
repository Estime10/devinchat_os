export type GithubBranch = {
  name: string;
  protected: boolean;
  /** ISO tip commit (author/committer date). */
  lastPushedAt: string | null;
};

type GithubBranchApiItem = {
  name?: string;
  protected?: boolean;
  commit?: {
    sha?: string;
  };
};

type GithubBranchDetailApi = {
  commit?: {
    commit?: {
      author?: { date?: string };
      committer?: { date?: string };
    };
  };
};

function mapGithubBranch(item: GithubBranchApiItem): GithubBranch | null {
  if (typeof item.name !== "string" || item.name.length === 0) {
    return null;
  }

  return {
    name: item.name,
    protected: item.protected === true,
    lastPushedAt: null,
  };
}

async function fetchBranchLastPushedAt(input: {
  accessToken: string;
  owner: string;
  repo: string;
  branch: string;
}): Promise<string | null> {
  const url = `https://api.github.com/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/branches/${encodeURIComponent(input.branch)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${input.accessToken}`,
      "User-Agent": "devinchat-os",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: {
      revalidate: 60,
      tags: ["github-branch-detail-fetch"],
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GithubBranchDetailApi;
  const authorDate = payload.commit?.commit?.author?.date;
  const committerDate = payload.commit?.commit?.committer?.date;

  if (typeof committerDate === "string") {
    return committerDate;
  }
  if (typeof authorDate === "string") {
    return authorDate;
  }
  return null;
}

/**
 * Liste les branches du repo + date tip commit (push).
 */
export async function fetchGithubBranches(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<GithubBranch[]> {
  const branches: GithubBranch[] = [];
  let page = 1;
  const perPage = 100;

  while (page <= 10) {
    const url = new URL(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`,
    );
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "devinchat-os",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: {
        revalidate: 60,
        tags: ["github-branches-fetch"],
      },
    });

    if (response.status === 404 || response.status === 403) {
      return [];
    }

    if (!response.ok) {
      throw new Error("GitHub branches fetch failed");
    }

    const payload = (await response.json()) as GithubBranchApiItem[];
    if (!Array.isArray(payload) || payload.length === 0) {
      break;
    }

    for (const item of payload) {
      const mapped = mapGithubBranch(item);
      if (mapped) {
        branches.push(mapped);
      }
    }

    if (payload.length < perPage) {
      break;
    }

    page += 1;
  }

  const withDates = await Promise.all(
    branches.map(async (branch) => {
      const lastPushedAt = await fetchBranchLastPushedAt({
        accessToken,
        owner,
        repo,
        branch: branch.name,
      });
      return { ...branch, lastPushedAt };
    }),
  );

  return withDates;
}
