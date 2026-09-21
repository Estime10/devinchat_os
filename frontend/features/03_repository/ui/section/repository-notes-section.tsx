"use client";

import type { EditorNoteAttachment } from "@/backend/features/04_features/domain/note-attachment";
import type { NoteBlock } from "@/backend/features/04_features/domain/note-block";
import type { OwnFeatureNote } from "@/backend/features/04_features/types/own-feature-note";
import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { StateError } from "@/frontend/components/states/error/state-error";
import {
  RepositoryNewNoteAction,
  RepositoryNotesHeaderActions,
} from "@/frontend/features/03_repository/ui/actions/repository-notes-actions";
import { RepositoryNoteChips } from "@/frontend/features/03_repository/ui/chip/repository-note-chips";
import { NoteEditor } from "@/frontend/features/03_repository/ui/note-editor/note-editor";

type RepositoryNotesSectionProps = {
  feature: OwnFeature;
  blocks: NoteBlock[];
  onChangeBlocks: (blocks: NoteBlock[]) => void;
  attachments: EditorNoteAttachment[];
  onAddAttachment: (file: File, label: string) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  notes: OwnFeatureNote[];
  activeNoteId: string | null;
  canSave: boolean;
  canClear: boolean;
  canDelete: boolean;
  canStartNew: boolean;
  pending?: boolean;
  error?: string | null;
  onSave: () => void;
  onClear: () => void;
  onDelete: () => void;
  onNew: () => void;
  onSelectNote: (noteId: string) => void;
};

/**
 * Notes de la branche — chips + éditeur (état remonté).
 */
export function RepositoryNotesSection({
  feature,
  blocks,
  onChangeBlocks,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  notes,
  activeNoteId,
  canSave,
  canClear,
  canDelete,
  canStartNew,
  pending = false,
  error = null,
  onSave,
  onClear,
  onDelete,
  onNew,
  onSelectNote,
}: RepositoryNotesSectionProps) {
  const branchLabel =
    feature.branchName && feature.branchName.length > 0
      ? feature.branchName
      : "branch deleted";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex h-5 shrink-0 items-center justify-between gap-4">
        <p className="font-sans text-xs leading-none tracking-[0.2em] text-white uppercase">
          {"// notes"}
        </p>
        <RepositoryNotesHeaderActions
          canSave={canSave}
          canClear={canClear}
          canDelete={canDelete}
          pending={pending}
          onSave={onSave}
          onClear={onClear}
          onDelete={onDelete}
        />
      </div>
      <div className="mb-4 shrink-0 space-y-1 border-b border-glass-border pb-4">
        <div className="flex items-center justify-between gap-4">
          <p className="min-w-0 truncate font-sans text-base leading-snug text-white">
            {feature.name}
          </p>
          <RepositoryNewNoteAction
            visible={canStartNew}
            pending={pending}
            onNew={onNew}
          />
        </div>
        <p className="truncate font-sans text-sm leading-snug text-white/50 uppercase">
          {branchLabel}
        </p>
        <p className="font-sans text-xs tracking-wide text-fg-default uppercase">
          {feature.status.replaceAll("_", " ")}
        </p>
        <RepositoryNoteChips
          notes={notes}
          activeNoteId={activeNoteId}
          onSelect={onSelectNote}
        />
        {error ? <StateError className="pt-1">{error}</StateError> : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <NoteEditor
          blocks={blocks}
          onChange={onChangeBlocks}
          attachments={attachments}
          onAddAttachment={onAddAttachment}
          onRemoveAttachment={onRemoveAttachment}
          attachmentsDisabled={pending}
        />
      </div>
    </section>
  );
}
