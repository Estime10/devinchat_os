import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import type { FeatureTree as FeatureTreeModel } from "@/backend/features/04_features/domain/build-feature-tree";
import { FeatureTreeNodeView } from "@/frontend/features/03_repository/ui/tree/feature-tree-node";
import { RepositoryFeatureRow } from "@/frontend/features/03_repository/ui/row/repository-feature-row";

type FeatureTreeProps = {
  tree: FeatureTreeModel;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: OwnFeature) => void;
};

function UnattachedTier({
  features,
  selectedFeatureId,
  onSelectFeature,
}: {
  features: OwnFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (feature: OwnFeature) => void;
}) {
  if (features.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center font-sans text-xs tracking-[0.2em] text-white uppercase">
        {"// open"}
      </p>
      <div className="feature-tree-unattached">
        {features.map((feature) => (
          <RepositoryFeatureRow
            key={feature.id}
            name={feature.name}
            branchName={feature.branchName ?? ""}
            status={feature.status}
            mergedInto={feature.parentBranchName}
            selected={selectedFeatureId === feature.id}
            onSelect={() => {
              onSelectFeature(feature);
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Arbre généalogique — main → develop → mergés → sous-branches.
 */
export function FeatureTree({
  tree,
  selectedFeatureId,
  onSelectFeature,
}: FeatureTreeProps) {
  return (
    <div className="feature-tree">
      {tree.root ? (
        <div className="feature-tree-root">
          <FeatureTreeNodeView
            node={tree.root}
            selectedFeatureId={selectedFeatureId}
            onSelectFeature={onSelectFeature}
          />
        </div>
      ) : null}
      <UnattachedTier
        features={tree.unattached}
        selectedFeatureId={selectedFeatureId}
        onSelectFeature={onSelectFeature}
      />
    </div>
  );
}
