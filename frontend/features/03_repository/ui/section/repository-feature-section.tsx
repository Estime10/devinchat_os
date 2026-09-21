import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { RepositoryFeatureList } from "@/frontend/features/03_repository/ui/list/repository-feature-list";

type RepositoryFeatureSectionProps = {
  features: OwnFeature[] | null;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: OwnFeature) => void;
};

/**
 * Section branches — titre + arbre sélectionnable.
 */
export function RepositoryFeatureSection({
  features,
  selectedFeatureId,
  onSelectFeature,
}: RepositoryFeatureSectionProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="mb-4 shrink-0 font-sans text-xs tracking-[0.2em] text-white uppercase">
        {"// branches"}
      </p>
      <RepositoryFeatureList
        features={features}
        selectedFeatureId={selectedFeatureId}
        onSelectFeature={onSelectFeature}
      />
    </section>
  );
}
