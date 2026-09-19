import { API } from "@/lib/api/endpoints";
import { getGithubOAuthEnv } from "@/lib/github/env";
import { buildGithubAuthorizeUrl } from "@/lib/github/oauth";
import { GITHUB_OAUTH_STATE_COOKIE, ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/github/connect — démarre OAuth GitHub.
 */
export async function connectGithubController(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(ROUTES.auth, request.url));
  }

  let clientId: string;
  try {
    ({ clientId } = getGithubOAuthEnv());
  } catch {
    const home = new URL(ROUTES.home, request.url);
    home.searchParams.set("github_error", "config");
    return NextResponse.redirect(home);
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = new URL(API.github.callback, request.url).toString();
  const authorizeUrl = buildGithubAuthorizeUrl({
    clientId,
    redirectUri,
    state,
  });

  const cookieStore = await cookies();
  cookieStore.set(GITHUB_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(authorizeUrl);
}
