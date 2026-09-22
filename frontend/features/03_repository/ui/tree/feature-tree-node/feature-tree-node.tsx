import type { OwnFeature } from "@/backend/features/04_features/types/own-feature/own-feature";
import type { FeatureTreeNode } from "@/backend/features/04_features/domain/build-feature-tree/build-feature-tree";
import { RepositoryFeatureRow } from "@/frontend/features/03_repository/ui/row/repository-feature-row";
import { EMPTY_NOTE_COUNT_BY_FEATURE_ID } from "@/lib/notes/empty-note-count-by-feature-id/empty-note-count-by-feature-id";

type FeatureTreeNodeViewProps = {
  node: FeatureTreeNode;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: OwnFeature) => void;
  noteCountByFeatureId?: Record<string, number>;
};

/**
 * Nœud récursif — cible au-dessus, branche mergée en dessous (ligne + « merged into »).
 */
export function FeatureTreeNodeView({
  node,
  selectedFeatureId,
  onSelectFeature,
  noteCountByFeatureId = EMPTY_NOTE_COUNT_BY_FEATURE_ID,
}: FeatureTreeNodeViewProps) {
  const { feature, children } = node;
  const hasChildren = children.length > 0;
  const noteCount = noteCountByFeatureId[feature.id] ?? 0;

  return (
    <div className="flex flex-col items-center">
      <RepositoryFeatureRow
        name={feature.name}
        branchName={feature.branchName ?? ""}
        status={feature.status}
        tipCommitSha={feature.tipCommitSha}
        mergedInto={feature.parentBranchName}
        noteCount={noteCount}
        selected={selectedFeatureId === feature.id}
        onSelect={() => {
          onSelectFeature(feature);
        }}
      />
      {hasChildren ? (
        children.length === 1 ? (
          <div className="feature-tree-children-solo">
            <div className="feature-tree-merge-link" aria-hidden>
              <span className="feature-tree-merge-stem" />
            </div>
            <FeatureTreeNodeView
              node={children[0]!}
              selectedFeatureId={selectedFeatureId}
              onSelectFeature={onSelectFeature}
              noteCountByFeatureId={noteCountByFeatureId}
            />
          </div>
        ) : (
          <>
            <div className="feature-tree-merge-link" aria-hidden>
              <span className="feature-tree-merge-stem" />
            </div>
            <div className="feature-tree-children">
              {children.map((child) => (
                <div key={child.feature.id} className="feature-tree-child">
                  <FeatureTreeNodeView
                    node={child}
                    selectedFeatureId={selectedFeatureId}
                    onSelectFeature={onSelectFeature}
                    noteCountByFeatureId={noteCountByFeatureId}
                  />
                </div>
              ))}
            </div>
          </>
        )
      ) : null}
    </div>
  );
}
