import { GITHUB_OAUTH_SCOPES } from "@/lib/github/env";

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";

export function buildGithubAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", GITHUB_OAUTH_SCOPES.join(" "));
  url.searchParams.set("state", input.state);
  return url.toString();
}

export type GithubTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
};

export async function exchangeGithubCode(input: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<GithubTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      code: input.code,
      redirect_uri: input.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error("GitHub token exchange failed");
  }

  const data = (await response.json()) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
  };

  if (!data.access_token || data.error) {
    throw new Error("GitHub token exchange rejected");
  }

  return {
    access_token: data.access_token,
    token_type: data.token_type ?? "bearer",
    scope: data.scope ?? "",
  };
}

export type GithubUser = {
  id: number;
  login: string;
};

export async function fetchGithubUser(
  accessToken: string,
): Promise<GithubUser> {
  const response = await fetch(USER_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "devinchat-os",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error("GitHub user fetch failed");
  }

  const data = (await response.json()) as { id?: number; login?: string };
  if (typeof data.id !== "number" || typeof data.login !== "string") {
    throw new Error("GitHub user payload invalid");
  }

  return { id: data.id, login: data.login };
}
