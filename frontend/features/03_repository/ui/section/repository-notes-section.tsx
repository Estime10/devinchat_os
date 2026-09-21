"use client";

import type { NoteBlock } from "@/backend/features/04_features/domain/note-block";
import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { NoteEditor } from "@/frontend/features/03_repository/ui/note-editor/note-editor";
import { RepositorySaveNotesAction } from "@/frontend/features/03_repository/ui/actions/repository-save-notes-action";

type RepositoryNotesSectionProps = {
  feature: OwnFeature;
  blocks: NoteBlock[];
  onChangeBlocks: (blocks: NoteBlock[]) => void;
  canSave: boolean;
  onSave: () => void;
};

/**
 * Notes de la branche sélectionnée — éditeur (état remonté).
 */
export function RepositoryNotesSection({
  feature,
  blocks,
  onChangeBlocks,
  canSave,
  onSave,
}: RepositoryNotesSectionProps) {
  const branchLabel =
    feature.branchName && feature.branchName.length > 0
      ? feature.branchName
      : "branch deleted";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <p className="font-sans text-xs tracking-[0.2em] text-white uppercase">
          {"// notes"}
        </p>
        <RepositorySaveNotesAction disabled={!canSave} onSave={onSave} />
      </div>
      <div className="mb-4 shrink-0 space-y-1 border-b border-glass-border pb-4">
        <p className="truncate font-sans text-base leading-snug text-white">
          {feature.name}
        </p>
        <p className="truncate font-sans text-sm leading-snug text-white/50 uppercase">
          {branchLabel}
        </p>
        <p className="font-sans text-xs tracking-wide text-fg-default uppercase">
          {feature.status.replaceAll("_", " ")}
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <NoteEditor blocks={blocks} onChange={onChangeBlocks} />
      </div>
    </section>
  );
}
