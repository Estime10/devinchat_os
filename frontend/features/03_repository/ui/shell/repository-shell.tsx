"use client";

import type { FeatureTree } from "@/backend/features/04_features/domain/build-feature-tree/build-feature-tree";
import type { OwnFeature } from "@/backend/features/04_features/types/own-feature/own-feature";
import { RepositoryHeader } from "@/frontend/features/03_repository/ui/header/repository-header";
import { RepositoryWorkspace } from "@/frontend/features/03_repository/ui/workspace/repository-workspace";
import type { GithubRepo } from "@/lib/github/repos/repos";
import { useFeatureNotes } from "@/lib/hooks/repository/use-feature-notes/use-feature-notes";
import { EMPTY_NOTE_COUNT_BY_FEATURE_ID } from "@/lib/notes/empty-note-count-by-feature-id/empty-note-count-by-feature-id";
import { useCallback, useState } from "react";

type RepositoryShellProps = {
  repo: GithubRepo;
  tree: FeatureTree | null;
  loadError: boolean;
  initialNoteCountByFeatureId?: Record<string, number>;
};

/**
 * Shell client repository — header + workspace notes DB.
 */
export function RepositoryShell({
  repo,
  tree,
  loadError,
  initialNoteCountByFeatureId = EMPTY_NOTE_COUNT_BY_FEATURE_ID,
}: RepositoryShellProps) {
  const [displayedFeatureId, setDisplayedFeatureId] = useState<string | null>(
    null,
  );
  const [persistedNoteCounts, setPersistedNoteCounts] = useState<
    Record<string, number>
  >(initialNoteCountByFeatureId);
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
    hasLoadedNotes,
    error,
    selectNote,
    startNewNote,
    saveNote,
    clearNote,
    deleteNote,
    addAttachment,
    removeAttachment,
  } = useFeatureNotes(displayedFeatureId);

  // Live override for the open feature — no setState-during-render.
  const noteCountByFeatureId =
    displayedFeatureId !== null && hasLoadedNotes
      ? {
          ...persistedNoteCounts,
          [displayedFeatureId]: notes.length,
        }
      : persistedNoteCounts;

  const handleDisplayedFeatureChange = useCallback(
    (feature: OwnFeature | null) => {
      if (displayedFeatureId !== null && hasLoadedNotes) {
        setPersistedNoteCounts((current) => {
          if (current[displayedFeatureId] === notes.length) {
            return current;
          }
          return {
            ...current,
            [displayedFeatureId]: notes.length,
          };
        });
      }
      setDisplayedFeatureId(feature?.id ?? null);
    },
    [displayedFeatureId, hasLoadedNotes, notes.length],
  );

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
        onDisplayedFeatureChange={handleDisplayedFeatureChange}
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
        noteCountByFeatureId={noteCountByFeatureId}
      />
    </main>
  );
}
