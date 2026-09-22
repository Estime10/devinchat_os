import { isProtectedPath, ROUTES } from "@/lib/routes";
import { updateSession } from "@/lib/supabase/proxy/proxy";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === ROUTES.auth;

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.auth;
    url.searchParams.set("mode", "login");
    return NextResponse.redirect(url);
  }

  // Session active : auth → homescreen.
  // Splash reste accessible (boot puis redirect client home | auth).
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Matcher Next.js — littéraux obligatoires (pas d'import / spread).
 * Doit rester aligné avec API (`lib/api/endpoints.ts`) + ROUTES.
 */
export const config = {
  matcher: [
    "/",
    "/auth",
    "/home",
    "/home/:path*",
    "/repository",
    "/repository/:path*",
    "/api/me",
    "/api/github/connect",
    "/api/github/callback",
    "/api/github/repos/commit-activity",
  ],
};
