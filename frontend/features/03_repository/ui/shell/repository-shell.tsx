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
    canClear,
    canDelete,
    canStartNew,
    isPending,
    error,
    selectNote,
    startNewNote,
    saveNote,
    clearNote,
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
        onAddNoteAttachment={(file, label) => {
          void addAttachment(file, label);
        }}
        onRemoveNoteAttachment={removeAttachment}
        onDisplayedFeatureChange={(feature) => {
          setDisplayedFeatureId(feature?.id ?? null);
        }}
        notes={notes}
        activeNoteId={activeNoteId}
        canSaveNotes={canSave}
        canClearNotes={canClear}
        canDeleteNotes={canDelete}
        canStartNewNote={canStartNew}
        notesPending={isPending}
        notesError={error}
        onSaveNotes={() => {
          void saveNote();
        }}
        onClearNotes={clearNote}
        onDeleteNotes={() => {
          void deleteNote();
        }}
        onNewNote={startNewNote}
        onSelectNote={selectNote}
      />
    </main>
  );
}
