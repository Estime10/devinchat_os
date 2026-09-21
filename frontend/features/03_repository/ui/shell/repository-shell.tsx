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
 * Shell client repository — header + workspace notes DB.
 */
export function RepositoryShell({
  repo,
  tree,
  loadError,
}: RepositoryShellProps) {
  const [displayedFeatureId, setDisplayedFeatureId] = useState<string | null>(
    null,
  );
  const {
    blocks,
    setBlocks,
    attachments,
    notes,
    activeNoteId,
    canSave,
    canDelete,
    canStartNew,
    isPending,
    selectNote,
    startNewNote,
    saveNote,
    deleteNote,
    addAttachment,
    removeAttachment,
  } = useFeatureNotes(displayedFeatureId);

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden py-5">
      <RepositoryHeader repo={repo} />
      <RepositoryWorkspace
        tree={tree}
        loadError={loadError}
        noteBlocks={blocks}
        onChangeNoteBlocks={setBlocks}
        noteAttachments={attachments}
        onAddNoteAttachment={(file) => {
          void addAttachment(file);
        }}
        onRemoveNoteAttachment={(attachmentId) => {
          void removeAttachment(attachmentId);
        }}
        onDisplayedFeatureChange={(feature) => {
          setDisplayedFeatureId(feature?.id ?? null);
        }}
        notes={notes}
        activeNoteId={activeNoteId}
        canSaveNotes={canSave}
        canDeleteNotes={canDelete}
        canStartNewNote={canStartNew}
        notesPending={isPending}
        onSaveNotes={() => {
          void saveNote();
        }}
        onDeleteNotes={() => {
          void deleteNote();
        }}
        onNewNote={startNewNote}
        onSelectNote={selectNote}
      />
    </main>
  );
}
