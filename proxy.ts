import { isProtectedPath, ROUTES } from "@/lib/routes";
import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === ROUTES.auth;

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.auth;
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.home;
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Matcher Next.js — littéraux obligatoires (pas d'import / spread).
 * Doit rester aligné avec ROUTES + PROTECTED_ROUTES (`lib/routes.ts`).
 */
export const config = {
  matcher: ["/", "/home", "/home/:path*", "/api/me"],
};
