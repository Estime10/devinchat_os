/**
 * Client HTTP GitHub lecture-seule (miroir V1).
 * Interdit toute mutation API — le scope OAuth `repo` reste trop large
 * (limitation OAuth App classique), donc on borne l’usage côté code.
 */

const GITHUB_API_ORIGIN = "https://api.github.com";

export function githubApiHeaders(accessToken: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "devinchat-os",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export type GithubApiGetOptions = {
  accessToken: string;
  /** Absolute api.github.com URL or path starting with /. */
  url: string | URL;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

/**
 * GET only vers api.github.com.
 */
export async function githubApiGet(
  options: GithubApiGetOptions,
): Promise<Response> {
  const url =
    typeof options.url === "string"
      ? new URL(
          options.url.startsWith("http")
            ? options.url
            : `${GITHUB_API_ORIGIN}${options.url}`,
        )
      : options.url;

  if (url.origin !== GITHUB_API_ORIGIN) {
    throw new Error("githubApiGet: only api.github.com is allowed");
  }

  return fetch(url, {
    method: "GET",
    headers: githubApiHeaders(options.accessToken),
    cache: options.cache,
    next: options.next,
  });
}
