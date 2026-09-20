import { loadOwnRepositoryFeatures } from "@/backend/features/04_features/services/load-own-repository-features";
import { RepositoryFeatureList } from "@/frontend/features/03_repository/ui/list/repository-feature-list";

type RepositoryFeatureLoaderProps = {
  owner: string;
  repo: string;
};

/**
 * Charge features DB (après sync) — async RSC.
 */
export async function RepositoryFeatureLoader({
  owner,
  repo,
}: RepositoryFeatureLoaderProps) {
  const features = await loadOwnRepositoryFeatures(owner, repo);
  return <RepositoryFeatureList features={features} />;
}
