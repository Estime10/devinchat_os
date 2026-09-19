/**
 * Couche transport HTTP — un seul endroit pour tous les controllers.
 * Domaine = services / domain / messages (pas de controllers par feature).
 * Ne pas confondre avec app/api (adapters Next.js).
 */
export { callbackGithubController } from "@/backend/controllers/callback-github";
export { connectGithubController } from "@/backend/controllers/connect-github";
export { getMeController } from "@/backend/controllers/get-me";
