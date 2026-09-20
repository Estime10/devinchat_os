import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import type { FeaturePyramid as FeaturePyramidModel } from "@/lib/github/build-feature-pyramid";
import { RepositoryFeatureRow } from "@/frontend/features/03_repository/ui/row/repository-feature-row";

type FeaturePyramidProps = {
  pyramid: FeaturePyramidModel;
};

function PyramidCard({ feature }: { feature: OwnFeature }) {
  return (
    <RepositoryFeatureRow
      name={feature.name}
      branchName={feature.branchName ?? ""}
      status={feature.status}
      mergedInto={feature.parentBranchName}
    />
  );
}

function PyramidTier({ features }: { features: OwnFeature[] }) {
  if (features.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-wrap justify-center gap-3">
      {features.map((feature) => (
        <PyramidCard key={feature.id} feature={feature} />
      ))}
    </div>
  );
}

/**
 * Pyramide — main + develop sur une ligne, puis done, puis in progress.
 */
export function FeaturePyramid({ pyramid }: FeaturePyramidProps) {
  const spine = [pyramid.production, pyramid.develop].filter(
    (feature): feature is OwnFeature => feature !== null,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col items-stretch gap-6 overflow-auto pb-6">
      {spine.length > 0 ? (
        <div className="mx-auto flex flex-wrap justify-center gap-3">
          {spine.map((feature) => (
            <PyramidCard key={feature.id} feature={feature} />
          ))}
        </div>
      ) : null}
      <PyramidTier features={pyramid.done} />
      <PyramidTier features={pyramid.inProgress} />
    </div>
  );
}
