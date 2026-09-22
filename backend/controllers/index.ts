/**
 * Couche transport HTTP — un seul endroit pour tous les controllers.
 * Domaine = services / domain / messages (pas de controllers par feature).
 * Ne pas confondre avec app/api (adapters Next.js).
 */
export { callbackGithubController } from "@/backend/controllers/callback-github/callback-github";
export { connectGithubController } from "@/backend/controllers/connect-github/connect-github";
export { getGithubCommitActivityController } from "@/backend/controllers/get-github-commit-activity/get-github-commit-activity";
export { getMeController } from "@/backend/controllers/get-me/get-me";
