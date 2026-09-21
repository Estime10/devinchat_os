"use client";

type RepositorySaveNotesActionProps = {
  disabled: boolean;
  onSave: () => void;
};

const linkClassName =
  "cursor-pointer font-sans text-sm tracking-tight text-fg-muted uppercase transition-colors hover:text-fg-default disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-fg-muted";

/**
 * CTA save notes — même style que [ logout ] / [ reconnect ].
 */
export function RepositorySaveNotesAction({
  disabled,
  onSave,
}: RepositorySaveNotesActionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={linkClassName}
      onClick={onSave}
    >
      [ save ]
    </button>
  );
}
