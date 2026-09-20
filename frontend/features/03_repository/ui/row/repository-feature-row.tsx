type RepositoryFeatureRowProps = {
  name: string;
  branchName: string;
  status: string;
  mergedInto: string | null;
};

/**
 * Carte feature — styles dans lib/styles/ui/feature-card.css.
 */
export function RepositoryFeatureRow({
  name,
  branchName,
  status,
  mergedInto,
}: RepositoryFeatureRowProps) {
  return (
    <div className="feature-card">
      <p className="truncate font-sans text-sm font-semibold leading-snug text-fg-default">
        {name}
      </p>
      <p className="truncate font-sans text-xs leading-snug text-fg-muted">
        {branchName}
      </p>
      <p className="mt-1 font-sans text-[10px] tracking-wide text-fg-default uppercase">
        {status.replaceAll("_", " ")}
      </p>
      {mergedInto ? (
        <p className="mt-0.5 truncate font-sans text-[10px] tracking-wide text-fg-muted">
          merged into {mergedInto}
        </p>
      ) : null}
    </div>
  );
}
