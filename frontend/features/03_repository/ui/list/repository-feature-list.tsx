import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { StateEmpty } from "@/frontend/components/states/empty/state-empty";
import { StateError } from "@/frontend/components/states/error/state-error";
import { FeaturePyramid } from "@/frontend/features/03_repository/ui/pyramid/feature-pyramid";
import { buildFeaturePyramid } from "@/lib/github/build-feature-pyramid";

type RepositoryFeatureListProps = {
  features: OwnFeature[] | null;
};

/**
 * Features du repo — états + composition pyramide.
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

  return <FeaturePyramid pyramid={buildFeaturePyramid(features)} />;
}
