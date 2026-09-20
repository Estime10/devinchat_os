import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { RepositoryFeatureList } from "@/frontend/features/03_repository/ui/list/repository-feature-list";

type RepositoryFeatureSectionProps = {
  features: OwnFeature[] | null;
};

/**
 * Section features — titre + liste (pas de Suspense : data prêtes au boot 100%).
 */
export function RepositoryFeatureSection({
  features,
}: RepositoryFeatureSectionProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="mb-4 shrink-0 font-sans text-xs tracking-[0.2em] text-fg-default uppercase">
        {"// features"}
      </p>
      <RepositoryFeatureList features={features} />
    </section>
  );
}
