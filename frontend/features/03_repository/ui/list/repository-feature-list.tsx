import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import type { FeatureTree } from "@/backend/features/04_features/domain/build-feature-tree";
import { StateEmpty } from "@/frontend/components/states/empty/state-empty";
import { StateError } from "@/frontend/components/states/error/state-error";
import { FeatureTree as FeatureTreeView } from "@/frontend/features/03_repository/ui/tree/feature-tree";

type RepositoryFeatureListProps = {
  tree: FeatureTree | null;
  loadError: boolean;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: OwnFeature) => void;
};

/**
 * Features du repo — états + arbre (données déjà résolues hors UI).
 */
export function RepositoryFeatureList({
  tree,
  loadError,
  selectedFeatureId,
  onSelectFeature,
}: RepositoryFeatureListProps) {
  if (loadError) {
    return (
      <StateError>Could not load features. Try reconnecting GitHub.</StateError>
    );
  }

  if (!tree || (!tree.root && tree.openForest.length === 0)) {
    return <StateEmpty>No branches found for this repository.</StateEmpty>;
  }

  return (
    <FeatureTreeView
      tree={tree}
      selectedFeatureId={selectedFeatureId}
      onSelectFeature={onSelectFeature}
    />
  );
}
