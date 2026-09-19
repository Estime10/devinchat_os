/**
 * Source de vérité des chemins applicatifs.
 * Importer depuis ici — jamais de string de route hardcodée ailleurs
 * (sauf `proxy.ts` `config.matcher`, qui doit rester des littéraux Next.js).
 */
export const ROUTES = {
  auth: "/",
  home: "/home",
  api: {
    me: "/api/me",
  },
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
