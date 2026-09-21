import { githubApiGet } from "@/lib/github/api-get";
import { GithubUnauthorizedError } from "@/lib/github/github-unauthorized-error";

export type GithubRepo = {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
  htmlUrl: string;
  defaultBranch: string;
  /** ISO — création du repo. */
  createdAt: string | null;
  /** ISO — dernier push (activité git). */
  pushedAt: string | null;
};

type GithubRepoApiItem = {
  id?: number;
  name?: string;
  full_name?: string;
  private?: boolean;
  html_url?: string;
  default_branch?: string | null;
  created_at?: string | null;
  pushed_at?: string | null;
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
    defaultBranch:
      typeof item.default_branch === "string" && item.default_branch.length > 0
        ? item.default_branch
        : "main",
    createdAt: typeof item.created_at === "string" ? item.created_at : null,
    pushedAt: typeof item.pushed_at === "string" ? item.pushed_at : null,
  };
}

/**
 * Liste les repos accessibles du user authentifié (paginé).
 * @throws {GithubUnauthorizedError} token rejeté (401)
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

    const response = await githubApiGet({
      accessToken,
      url,
      cache: "no-store",
    });

    if (response.status === 401) {
      throw new GithubUnauthorizedError();
    }

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

export type FetchGithubRepoResult =
  | { kind: "ok"; repo: GithubRepo }
  | { kind: "unauthorized" }
  | { kind: "missing" }
  | { kind: "error" };

/**
 * Un repo GitHub si accessible avec le token.
 */
export async function fetchGithubRepo(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<FetchGithubRepoResult> {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  const response = await githubApiGet({
    accessToken,
    url,
    cache: "no-store",
  });

  if (response.status === 401) {
    return { kind: "unauthorized" };
  }

  if (response.status === 403 || response.status === 404) {
    return { kind: "missing" };
  }

  if (!response.ok) {
    return { kind: "error" };
  }

  const payload = (await response.json()) as GithubRepoApiItem;
  const mapped = mapGithubRepo(payload);
  if (!mapped) {
    return { kind: "error" };
  }

  return { kind: "ok", repo: mapped };
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
