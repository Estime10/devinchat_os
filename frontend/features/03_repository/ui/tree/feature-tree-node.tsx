import type { FeatureTreeNode } from "@/lib/github/build-feature-tree";
import { RepositoryFeatureRow } from "@/frontend/features/03_repository/ui/row/repository-feature-row";

type FeatureTreeNodeViewProps = {
  node: FeatureTreeNode;
};

/**
 * Nœud récursif — card + stem + enfants (sous-branches).
 */
export function FeatureTreeNodeView({ node }: FeatureTreeNodeViewProps) {
  const { feature, children } = node;
  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <RepositoryFeatureRow
        name={feature.name}
        branchName={feature.branchName ?? ""}
        status={feature.status}
        mergedInto={null}
      />
      {hasChildren ? (
        <>
          <div className="feature-tree-stem" aria-hidden />
          {children.length === 1 ? (
            <div className="feature-tree-children-solo">
              <FeatureTreeNodeView node={children[0]!} />
            </div>
          ) : (
            <div className="feature-tree-children">
              {children.map((child) => (
                <div key={child.feature.id} className="feature-tree-child">
                  <FeatureTreeNodeView node={child} />
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
