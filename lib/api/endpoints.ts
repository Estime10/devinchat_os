/**
 * Source de vérité des endpoints API.
 * Importer depuis ici — jamais de string `/api/...` hardcodée ailleurs
 * (sauf `proxy.ts` `config.matcher`, littéraux Next.js obligatoires).
 */
export const API = {
  me: "/api/me",
  github: {
    connect: "/api/github/connect",
    callback: "/api/github/callback",
    commitActivity: "/api/github/repos/commit-activity",
  },
} as const;

/** Liste plate — utile pour docs, tests, audits. */
export const API_ENDPOINTS = [
  API.me,
  API.github.connect,
  API.github.callback,
  API.github.commitActivity,
] as const;
