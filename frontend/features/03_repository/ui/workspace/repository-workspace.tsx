"use client";

import type { FeatureTree } from "@/backend/features/04_features/domain/build-feature-tree";
import type { NoteBlock } from "@/backend/features/04_features/domain/note-block";
import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { RepositoryFeatureSection } from "@/frontend/features/03_repository/ui/section/repository-feature-section";
import { RepositoryNotesSection } from "@/frontend/features/03_repository/ui/section/repository-notes-section";
import { useRepositoryWorkspace } from "@/lib/hooks/repository/use-repository-workspace";
import { useEffect, useRef } from "react";

type RepositoryWorkspaceProps = {
  tree: FeatureTree | null;
  loadError: boolean;
  noteBlocks: NoteBlock[];
  onChangeNoteBlocks: (blocks: NoteBlock[]) => void;
  onDisplayedFeatureChange: (feature: OwnFeature | null) => void;
  canSaveNotes: boolean;
  onSaveNotes: () => void;
};

/**
 * Présentation workspace — état dans useRepositoryWorkspace.
 */
export function RepositoryWorkspace({
  tree,
  loadError,
  noteBlocks,
  onChangeNoteBlocks,
  onDisplayedFeatureChange,
  canSaveNotes,
  onSaveNotes,
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
              canSave={canSaveNotes}
              onSave={onSaveNotes}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
