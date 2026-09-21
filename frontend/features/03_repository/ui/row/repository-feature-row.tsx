"use client";

type RepositoryFeatureRowProps = {
  name: string;
  branchName: string;
  status: string;
  mergedInto: string | null;
  selected?: boolean;
  onSelect?: () => void;
};

/**
 * Carte feature — même échelle typo homescreen.
 * Enfants en pointer-events:none → curseur main sur toute la surface.
 */
export function RepositoryFeatureRow({
  name,
  branchName,
  status,
  mergedInto,
  selected = false,
  onSelect,
}: RepositoryFeatureRowProps) {
  const className = selected
    ? "feature-card feature-card-selected"
    : "feature-card";

  const body = (
    <>
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
        <p className="mt-0.5 truncate font-sans text-[10px] tracking-wide text-white/30">
          merged into {mergedInto}
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
