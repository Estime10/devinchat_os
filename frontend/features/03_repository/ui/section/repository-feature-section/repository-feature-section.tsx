import type { OwnFeature } from "@/backend/features/04_features/types/own-feature/own-feature";
import type { FeatureTree } from "@/backend/features/04_features/domain/build-feature-tree/build-feature-tree";
import { RepositoryFeatureList } from "@/frontend/features/03_repository/ui/list/repository-feature-list";

type RepositoryFeatureSectionProps = {
  tree: FeatureTree | null;
  loadError: boolean;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: OwnFeature) => void;
  noteCountByFeatureId?: Record<string, number>;
};

/**
 * Section branches — titre + arbre sélectionnable.
 */
export function RepositoryFeatureSection({
  tree,
  loadError,
  selectedFeatureId,
  onSelectFeature,
  noteCountByFeatureId,
}: RepositoryFeatureSectionProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="mb-4 shrink-0 font-sans text-xs tracking-[0.2em] text-white uppercase">
        {"// branches"}
      </p>
      <RepositoryFeatureList
        tree={tree}
        loadError={loadError}
        selectedFeatureId={selectedFeatureId}
        onSelectFeature={onSelectFeature}
        noteCountByFeatureId={noteCountByFeatureId}
      />
    </section>
  );
}
