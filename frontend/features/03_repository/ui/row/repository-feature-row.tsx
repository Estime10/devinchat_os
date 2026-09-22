"use client";

type RepositoryFeatureRowProps = {
  name: string;
  branchName: string;
  status: string;
  mergedInto: string | null;
  noteCount?: number;
  selected?: boolean;
  onSelect?: () => void;
};

/**
 * Carte feature — même échelle typo homescreen.
 * Badge notes : coin haut-droit, légèrement hors de la card.
 * Enfants en pointer-events:none → curseur main sur toute la surface.
 */
export function RepositoryFeatureRow({
  name,
  branchName,
  status,
  mergedInto,
  noteCount = 0,
  selected = false,
  onSelect,
}: RepositoryFeatureRowProps) {
  const className = selected
    ? "feature-card feature-card-selected"
    : "feature-card";

  const showNotesBadge = noteCount > 0;

  const body = (
    <>
      {showNotesBadge ? (
        <span
          className="feature-card-notes-badge"
          aria-label={`${noteCount} note${noteCount > 1 ? "s" : ""}`}
          title={`${noteCount} note${noteCount > 1 ? "s" : ""}`}
        >
          {noteCount > 99 ? "99+" : noteCount}
        </span>
      ) : null}
      <p className="truncate font-sans text-sm leading-snug text-white">
        {name}
      </p>
      <p className="truncate font-sans text-xs leading-snug text-white/50">
        {branchName.length > 0 ? branchName : "branch deleted"}
      </p>
      <p className="mt-1 font-sans text-[10px] tracking-wide text-fg-default uppercase">
        {status.replaceAll("_", " ")}
      </p>
      {mergedInto ? (
        <p className="mt-1 truncate font-sans text-[10px] tracking-wide text-fg-muted normal-case">
          → merged into {mergedInto}
        </p>
      ) : null}
    </>
  );

  if (!onSelect) {
    return <div className={className}>{body}</div>;
  }

  return (
    <button
      type="button"
      className={className}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {body}
    </button>
  );
}
