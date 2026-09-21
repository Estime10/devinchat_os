import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { StateEmpty } from "@/frontend/components/states/empty/state-empty";
import { StateError } from "@/frontend/components/states/error/state-error";
import { FeatureTree } from "@/frontend/features/03_repository/ui/tree/feature-tree";
import { buildFeatureTree } from "@/lib/github/build-feature-tree";

type RepositoryFeatureListProps = {
  features: OwnFeature[] | null;
};

/**
 * Features du repo — états + arbre généalogique.
 */
export function RepositoryFeatureList({
  features,
}: RepositoryFeatureListProps) {
  if (features === null) {
    return (
      <StateError>Could not load features. Try reconnecting GitHub.</StateError>
    );
  }

  if (features.length === 0) {
    return <StateEmpty>No branches found for this repository.</StateEmpty>;
  }

  return <FeatureTree tree={buildFeatureTree(features)} />;
}
