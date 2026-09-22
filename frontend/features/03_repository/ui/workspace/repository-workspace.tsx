"use client";

import type { FeatureTree } from "@/backend/features/04_features/domain/build-feature-tree/build-feature-tree";
import type { EditorNoteAttachment } from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import type { NoteBlock } from "@/backend/features/04_features/domain/note-block/note-block";
import type { OwnFeatureNote } from "@/backend/features/04_features/types/own-feature-note/own-feature-note";
import type { OwnFeature } from "@/backend/features/04_features/types/own-feature/own-feature";
import { RepositoryFeatureSection } from "@/frontend/features/03_repository/ui/section/repository-feature-section/repository-feature-section";
import { RepositoryNotesSection } from "@/frontend/features/03_repository/ui/section/repository-notes-section/repository-notes-section";
import { useRepositoryWorkspace } from "@/lib/hooks/repository/use-repository-workspace/use-repository-workspace";
import { useEffect, useRef } from "react";

type RepositoryWorkspaceProps = {
  tree: FeatureTree | null;
  loadError: boolean;
  noteBlocks: NoteBlock[];
  onChangeNoteBlocks: (blocks: NoteBlock[]) => void;
  noteAttachments: EditorNoteAttachment[];
  onAddNoteAttachment: (file: File, label: string) => void;
  onRemoveNoteAttachment: (attachmentId: string) => void;
  onDisplayedFeatureChange: (feature: OwnFeature | null) => void;
  notes: OwnFeatureNote[];
  activeNoteId: string | null;
  canSaveNotes: boolean;
  canClearNotes: boolean;
  canDeleteNotes: boolean;
  canStartNewNote: boolean;
  notesPending?: boolean;
  notesError?: string | null;
  onSaveNotes: () => void;
  onClearNotes: () => void;
  onDeleteNotes: () => void;
  onNewNote: () => void;
  onSelectNote: (noteId: string) => void;
  noteCountByFeatureId?: Record<string, number>;
};

/**
 * Présentation workspace — état dans useRepositoryWorkspace.
 */
export function RepositoryWorkspace({
  tree,
  loadError,
  noteBlocks,
  onChangeNoteBlocks,
  noteAttachments,
  onAddNoteAttachment,
  onRemoveNoteAttachment,
  onDisplayedFeatureChange,
  notes,
  activeNoteId,
  canSaveNotes,
  canClearNotes,
  canDeleteNotes,
  canStartNewNote,
  notesPending = false,
  notesError = null,
  onSaveNotes,
  onClearNotes,
  onDeleteNotes,
  onNewNote,
  onSelectNote,
  noteCountByFeatureId,
}: RepositoryWorkspaceProps) {
  const {
    selectedId,
    displayed,
    shellRef,
    notesPanelRef,
    notesInnerRef,
    selectFeature,
  } = useRepositoryWorkspace();

  const onDisplayedFeatureChangeRef = useRef(onDisplayedFeatureChange);

  useEffect(() => {
    onDisplayedFeatureChangeRef.current = onDisplayedFeatureChange;
  }, [onDisplayedFeatureChange]);

  useEffect(() => {
    onDisplayedFeatureChangeRef.current(displayed);
  }, [displayed]);

  return (
    <div ref={shellRef} className="repository-workspace">
      <div className="flex min-h-0 min-w-0 flex-1 justify-center overflow-hidden">
        <div className="flex min-h-0 w-full max-w-5xl flex-col overflow-hidden">
          <RepositoryFeatureSection
            tree={tree}
            loadError={loadError}
            selectedFeatureId={selectedId}
            onSelectFeature={selectFeature}
            noteCountByFeatureId={noteCountByFeatureId}
          />
        </div>
      </div>

      <div
        ref={notesPanelRef}
        className="repository-workspace-notes"
        aria-hidden={selectedId === null}
      >
        <div
          ref={notesInnerRef}
          className="flex h-full min-h-0 flex-col overflow-hidden pl-14"
        >
          {displayed ? (
            <RepositoryNotesSection
              feature={displayed}
              blocks={noteBlocks}
              onChangeBlocks={onChangeNoteBlocks}
              attachments={noteAttachments}
              onAddAttachment={onAddNoteAttachment}
              onRemoveAttachment={onRemoveNoteAttachment}
              notes={notes}
              activeNoteId={activeNoteId}
              canSave={canSaveNotes}
              canClear={canClearNotes}
              canDelete={canDeleteNotes}
              canStartNew={canStartNewNote}
              pending={notesPending}
              error={notesError}
              onSave={onSaveNotes}
              onClear={onClearNotes}
              onDelete={onDeleteNotes}
              onNew={onNewNote}
              onSelectNote={onSelectNote}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
