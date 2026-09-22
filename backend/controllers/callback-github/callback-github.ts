import { upsertGithubConnection } from "@/backend/features/02_github/services/upsert-github-connection/upsert-github-connection";
import { githubCommitActivityCacheTag } from "@/backend/features/02_github/services/get-own-github-commit-activity/get-own-github-commit-activity";
import { githubReposCacheTag } from "@/backend/features/02_github/services/list-own-github-repos/list-own-github-repos";
import { API } from "@/lib/api/endpoints";
import { getGithubOAuthEnv } from "@/lib/github/env/env";
import { exchangeGithubCode, fetchGithubUser } from "@/lib/github/oauth/oauth";
import { GITHUB_OAUTH_STATE_COOKIE, ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server/server";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function homeWithError(request: Request, code: string) {
  const home = new URL(ROUTES.home, request.url);
  home.searchParams.set("github_error", code);
  return home;
}

/**
 * GET /api/github/callback — échange code OAuth + persist connexion.
 */
export async function callbackGithubController(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GITHUB_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(GITHUB_OAUTH_STATE_COOKIE);

  if (oauthError) {
    return NextResponse.redirect(homeWithError(request, "denied"));
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(homeWithError(request, "state"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(ROUTES.auth, request.url));
  }

  let clientId: string;
  let clientSecret: string;
  try {
    ({ clientId, clientSecret } = getGithubOAuthEnv());
  } catch {
    return NextResponse.redirect(homeWithError(request, "config"));
  }

  const redirectUri = new URL(API.github.callback, request.url).toString();

  try {
    const token = await exchangeGithubCode({
      clientId,
      clientSecret,
      code,
      redirectUri,
    });
    const githubUser = await fetchGithubUser(token.access_token);
    const result = await upsertGithubConnection({
      userId: user.id,
      githubUserId: githubUser.id,
      githubLogin: githubUser.login,
      token,
    });

    if (!result.ok) {
      return NextResponse.redirect(
        homeWithError(
          request,
          result.reason === "conflict" ? "conflict" : "persist",
        ),
      );
    }

    revalidateTag(githubReposCacheTag(user.id), "minutes");
    revalidateTag(githubCommitActivityCacheTag(user.id), "minutes");
  } catch {
    return NextResponse.redirect(homeWithError(request, "exchange"));
  }

  return NextResponse.redirect(new URL(ROUTES.home, request.url));
}
