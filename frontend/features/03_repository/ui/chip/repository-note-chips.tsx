"use client";

import type { OwnFeatureNote } from "@/backend/features/04_features/types/own-feature-note";

type RepositoryNoteChipsProps = {
  notes: OwnFeatureNote[];
  activeNoteId: string | null;
  onSelect: (noteId: string) => void;
};

/**
 * Chips notes sauvées — rangée dédiée sous le status (wrap propre).
 */
export function RepositoryNoteChips({
  notes,
  activeNoteId,
  onSelect,
}: RepositoryNoteChipsProps) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
      {notes.map((note) => {
        const selected = note.id === activeNoteId;
        return (
          <button
            key={note.id}
            type="button"
            title={note.title}
            aria-pressed={selected}
            className={`inline-flex max-w-20 items-center font-sans text-xs tracking-wide uppercase transition-colors ${
              selected ? "text-fg-default" : "text-white/45 hover:text-white"
            }`}
            onClick={() => {
              onSelect(note.id);
            }}
          >
            <span aria-hidden>[</span>
            <span className="min-w-0 truncate">{note.title}</span>
            <span aria-hidden>]</span>
          </button>
        );
      })}
    </div>
  );
}
