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

function PyramidTier({
  features,
  maxWidthClass,
}: {
  features: OwnFeature[];
  maxWidthClass: string;
}) {
  if (features.length === 0) {
    return null;
  }

  return (
    <div
      className={`mx-auto flex w-full ${maxWidthClass} flex-wrap justify-center gap-3`}
    >
      {features.map((feature) => (
        <PyramidCard key={feature.id} feature={feature} />
      ))}
    </div>
  );
}

/**
 * Pyramide de cards — présentation pure (données déjà groupées).
 */
export function FeaturePyramid({ pyramid }: FeaturePyramidProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-stretch gap-6 overflow-auto pb-6">
      {pyramid.production ? (
        <div className="mx-auto flex justify-center">
          <PyramidCard feature={pyramid.production} />
        </div>
      ) : null}
      {pyramid.develop ? (
        <div className="mx-auto flex justify-center">
          <PyramidCard feature={pyramid.develop} />
        </div>
      ) : null}
      <PyramidTier features={pyramid.done} maxWidthClass="max-w-5xl" />
      <PyramidTier features={pyramid.inProgress} maxWidthClass="max-w-3xl" />
    </div>
  );
}
