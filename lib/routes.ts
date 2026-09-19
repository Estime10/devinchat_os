import { API } from "@/lib/api/endpoints";

/**
 * Source de vérité des chemins pages.
 * Les endpoints API → `lib/api/endpoints.ts` (réexportés ici pour commodité).
 * (sauf `proxy.ts` `config.matcher`, littéraux Next.js obligatoires).
 */
export const ROUTES = {
  auth: "/",
  home: "/home",
  api: API,
} as const;

/** Routes qui exigent une session authentifiée. */
export const PROTECTED_ROUTES = [ROUTES.home] as const;

/**
 * True si le pathname est une route protégée (exacte ou sous-chemin).
 */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export const GITHUB_OAUTH_STATE_COOKIE = "github_oauth_state";
