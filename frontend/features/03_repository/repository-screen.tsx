import { RepositoryHeader } from "@/frontend/features/03_repository/ui/header/repository-header";
import { RepositoryFeatureSection } from "@/frontend/features/03_repository/ui/section/repository-feature-section";
import type { GithubRepo } from "@/lib/github/repos";

type RepositoryScreenProps = {
  repo: GithubRepo;
};

/**
 * Screen repository — orchestre header + section features.
 */
export function RepositoryScreen({ repo }: RepositoryScreenProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden py-5">
      <RepositoryHeader repo={repo} />
      <RepositoryFeatureSection fullName={repo.fullName} />
    </main>
  );
}
