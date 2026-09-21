"use client";

import type { FeatureTree } from "@/backend/features/04_features/domain/build-feature-tree";
import { RepositoryHeader } from "@/frontend/features/03_repository/ui/header/repository-header";
import { RepositoryWorkspace } from "@/frontend/features/03_repository/ui/workspace/repository-workspace";
import type { GithubRepo } from "@/lib/github/repos";
import { useFeatureNotes } from "@/lib/hooks/repository/use-feature-notes";
import { useState } from "react";

type RepositoryShellProps = {
  repo: GithubRepo;
  tree: FeatureTree | null;
  loadError: boolean;
};

/**
 * Shell client repository — header + workspace notes partagés.
 */
export function RepositoryShell({
  repo,
  tree,
  loadError,
}: RepositoryShellProps) {
  const [displayedFeatureId, setDisplayedFeatureId] = useState<string | null>(
    null,
  );
  const { blocks, setBlocks, hasContent, saveNow } =
    useFeatureNotes(displayedFeatureId);

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden py-5">
      <RepositoryHeader repo={repo} />
      <RepositoryWorkspace
        tree={tree}
        loadError={loadError}
        noteBlocks={blocks}
        onChangeNoteBlocks={setBlocks}
        onDisplayedFeatureChange={(feature) => {
          setDisplayedFeatureId(feature?.id ?? null);
        }}
        canSaveNotes={hasContent}
        onSaveNotes={saveNow}
      />
    </main>
  );
}
