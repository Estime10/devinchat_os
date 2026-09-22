"use client";

type NotesLinkButtonProps = {
  disabled?: boolean;
  onClick: () => void;
  children: string;
};

const linkClassName =
  "inline-flex cursor-pointer items-center font-sans text-sm leading-none tracking-tight text-fg-muted uppercase transition-colors hover:text-fg-default disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-fg-muted";

function NotesLinkButton({
  disabled = false,
  onClick,
  children,
}: NotesLinkButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={linkClassName}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type RepositoryNotesHeaderActionsProps = {
  canSave: boolean;
  canClear: boolean;
  canDelete: boolean;
  pending?: boolean;
  onSave: () => void;
  onClear: () => void;
  onDelete: () => void;
};

/**
 * [ save ] [ clear ] [ delete ] — même ligne que // notes.
 */
export function RepositoryNotesHeaderActions({
  canSave,
  canClear,
  canDelete,
  pending = false,
  onSave,
  onClear,
  onDelete,
}: RepositoryNotesHeaderActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <NotesLinkButton disabled={!canSave || pending} onClick={onSave}>
        [ save ]
      </NotesLinkButton>
      <NotesLinkButton disabled={!canClear || pending} onClick={onClear}>
        [ clear ]
      </NotesLinkButton>
      {canDelete ? (
        <NotesLinkButton disabled={pending} onClick={onDelete}>
          [ delete ]
        </NotesLinkButton>
      ) : null}
    </div>
  );
}

type RepositoryNewNoteActionProps = {
  visible: boolean;
  pending?: boolean;
  onNew: () => void;
};

/**
 * [ new ] — à côté du titre feature dans le panneau notes.
 */
export function RepositoryNewNoteAction({
  visible,
  pending = false,
  onNew,
}: RepositoryNewNoteActionProps) {
  if (!visible) {
    return null;
  }

  return (
    <NotesLinkButton disabled={pending} onClick={onNew}>
      [ new ]
    </NotesLinkButton>
  );
}
