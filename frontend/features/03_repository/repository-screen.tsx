import { buildFeatureTree } from "@/backend/features/04_features/domain/build-feature-tree/build-feature-tree";
import type { OwnFeature } from "@/backend/features/04_features/types/own-feature/own-feature";
import { RepositoryShell } from "@/frontend/features/03_repository/ui/shell/repository-shell";
import type { GithubRepo } from "@/lib/github/repos/repos";
import { EMPTY_NOTE_COUNT_BY_FEATURE_ID } from "@/lib/notes/empty-note-count-by-feature-id/empty-note-count-by-feature-id";

type RepositoryScreenProps = {
  repo: GithubRepo;
  features: OwnFeature[] | null;
  noteCountByFeatureId?: Record<string, number>;
};

/**
 * Screen repository — délègue au shell client (header + workspace).
 */
export function RepositoryScreen({
  repo,
  features,
  noteCountByFeatureId = EMPTY_NOTE_COUNT_BY_FEATURE_ID,
}: RepositoryScreenProps) {
  const loadError = features === null;
  const tree = features === null ? null : buildFeatureTree(features);

  return (
    <RepositoryShell
      repo={repo}
      tree={tree}
      loadError={loadError}
      initialNoteCountByFeatureId={noteCountByFeatureId}
    />
  );
}
