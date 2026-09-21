type RepositoryFeatureRowProps = {
  name: string;
  branchName: string;
  status: string;
  mergedInto: string | null;
};

/**
 * Carte feature — même échelle typo homescreen :
 * identité white · meta white/50 · chrome fg-default · tertiaire white/30.
 */
export function RepositoryFeatureRow({
  name,
  branchName,
  status,
  mergedInto,
}: RepositoryFeatureRowProps) {
  return (
    <div className="feature-card">
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
    </div>
  );
}
