export type GithubRepo = {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
  htmlUrl: string;
  description: string | null;
};

type GithubRepoApiItem = {
  id?: number;
  name?: string;
  full_name?: string;
  private?: boolean;
  html_url?: string;
  description?: string | null;
};

function mapGithubRepo(item: GithubRepoApiItem): GithubRepo | null {
  if (
    typeof item.id !== "number" ||
    typeof item.name !== "string" ||
    typeof item.full_name !== "string" ||
    typeof item.private !== "boolean" ||
    typeof item.html_url !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    fullName: item.full_name,
    isPrivate: item.private,
    htmlUrl: item.html_url,
    description: typeof item.description === "string" ? item.description : null,
  };
}

/**
 * Liste les repos accessibles du user authentifié (paginé).
 */
export async function fetchGithubRepos(
  accessToken: string,
): Promise<GithubRepo[]> {
  const repos: GithubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (page <= 10) {
    const url = new URL("https://api.github.com/user/repos");
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));
    url.searchParams.set(
      "affiliation",
      "owner,collaborator,organization_member",
    );
    url.searchParams.set("sort", "updated");

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "devinchat-os",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error("GitHub repositories fetch failed");
    }

    const payload = (await response.json()) as GithubRepoApiItem[];
    if (!Array.isArray(payload) || payload.length === 0) {
      break;
    }

    for (const item of payload) {
      const mapped = mapGithubRepo(item);
      if (mapped) {
        repos.push(mapped);
      }
    }

    if (payload.length < perPage) {
      break;
    }

    page += 1;
  }

  return repos;
}

export function splitReposByVisibility(repos: GithubRepo[]): {
  privateRepos: GithubRepo[];
  publicRepos: GithubRepo[];
} {
  const privateRepos: GithubRepo[] = [];
  const publicRepos: GithubRepo[] = [];

  for (const repo of repos) {
    if (repo.isPrivate) {
      privateRepos.push(repo);
    } else {
      publicRepos.push(repo);
    }
  }

  return { privateRepos, publicRepos };
}
