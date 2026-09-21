import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { RepositoryHeader } from "@/frontend/features/03_repository/ui/header/repository-header";
import { RepositoryFeatureSection } from "@/frontend/features/03_repository/ui/section/repository-feature-section";
import type { GithubRepo } from "@/lib/github/repos";

type RepositoryScreenProps = {
  repo: GithubRepo;
  features: OwnFeature[] | null;
};

/**
 * Screen repository — orchestre header + arbre de branches.
 */
export function RepositoryScreen({ repo, features }: RepositoryScreenProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden py-5">
      <RepositoryHeader repo={repo} />
      <RepositoryFeatureSection features={features} />
    </main>
  );
}
