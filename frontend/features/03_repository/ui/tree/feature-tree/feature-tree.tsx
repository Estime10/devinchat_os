import type { OwnFeature } from "@/backend/features/04_features/types/own-feature/own-feature";
import type { FeatureTree as FeatureTreeModel } from "@/backend/features/04_features/domain/build-feature-tree/build-feature-tree";
import { FeatureTreeNodeView } from "@/frontend/features/03_repository/ui/tree/feature-tree-node/feature-tree-node";

type FeatureTreeProps = {
  tree: FeatureTreeModel;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: OwnFeature) => void;
  noteCountByFeatureId?: Record<string, number>;
};

function OpenForestTier({
  forest,
  selectedFeatureId,
  onSelectFeature,
  noteCountByFeatureId,
}: {
  forest: FeatureTreeModel["openForest"];
  selectedFeatureId: string | null;
  onSelectFeature: (feature: OwnFeature) => void;
  noteCountByFeatureId?: Record<string, number>;
}) {
  if (forest.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-center font-sans text-xs tracking-[0.2em] text-white uppercase">
        {"// open"}
      </p>
      <div className="feature-tree-open-forest">
        {forest.map((node) => (
          <div key={node.feature.id} className="feature-tree-open-root">
            <FeatureTreeNodeView
              node={node}
              selectedFeatureId={selectedFeatureId}
              onSelectFeature={onSelectFeature}
              noteCountByFeatureId={noteCountByFeatureId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Arbre généalogique — spine trunk + forêt open (avec lignes).
 */
export function FeatureTree({
  tree,
  selectedFeatureId,
  onSelectFeature,
  noteCountByFeatureId,
}: FeatureTreeProps) {
  return (
    <div className="feature-tree">
      {tree.root ? (
        <div className="feature-tree-root">
          <FeatureTreeNodeView
            node={tree.root}
            selectedFeatureId={selectedFeatureId}
            onSelectFeature={onSelectFeature}
            noteCountByFeatureId={noteCountByFeatureId}
          />
        </div>
      ) : null}
      <OpenForestTier
        forest={tree.openForest}
        selectedFeatureId={selectedFeatureId}
        onSelectFeature={onSelectFeature}
        noteCountByFeatureId={noteCountByFeatureId}
      />
    </div>
  );
}
