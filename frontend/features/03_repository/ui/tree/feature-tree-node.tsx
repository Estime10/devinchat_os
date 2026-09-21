import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import type { FeatureTreeNode } from "@/backend/features/04_features/domain/build-feature-tree";
import { RepositoryFeatureRow } from "@/frontend/features/03_repository/ui/row/repository-feature-row";

type FeatureTreeNodeViewProps = {
  node: FeatureTreeNode;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: OwnFeature) => void;
};

/**
 * Nœud récursif — card + stem + enfants (sous-branches).
 */
export function FeatureTreeNodeView({
  node,
  selectedFeatureId,
  onSelectFeature,
}: FeatureTreeNodeViewProps) {
  const { feature, children } = node;
  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <RepositoryFeatureRow
        name={feature.name}
        branchName={feature.branchName ?? ""}
        status={feature.status}
        mergedInto={null}
        selected={selectedFeatureId === feature.id}
        onSelect={() => {
          onSelectFeature(feature);
        }}
      />
      {hasChildren ? (
        <>
          <div className="feature-tree-stem" aria-hidden />
          {children.length === 1 ? (
            <div className="feature-tree-children-solo">
              <FeatureTreeNodeView
                node={children[0]!}
                selectedFeatureId={selectedFeatureId}
                onSelectFeature={onSelectFeature}
              />
            </div>
          ) : (
            <div className="feature-tree-children">
              {children.map((child) => (
                <div key={child.feature.id} className="feature-tree-child">
                  <FeatureTreeNodeView
                    node={child}
                    selectedFeatureId={selectedFeatureId}
                    onSelectFeature={onSelectFeature}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
