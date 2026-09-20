type RepositoryFeatureRowProps = {
  name: string;
  branchName: string;
  status: string;
  mergedInto: string | null;
};

/**
 * Carte feature — pyramide (présentation pure).
 */
export function RepositoryFeatureRow({
  name,
  branchName,
  status,
  mergedInto,
}: RepositoryFeatureRowProps) {
  return (
    <div className="flex min-h-[4.75rem] min-w-[11rem] max-w-[14rem] flex-col justify-center rounded-none border border-glass-border/60 bg-glass-bg/40 px-3 py-2.5 backdrop-blur-sm">
      <p className="truncate font-sans text-sm font-semibold leading-snug text-white">
        {name}
      </p>
      <p className="truncate font-sans text-xs leading-snug text-white/50">
        {branchName}
      </p>
      <p className="mt-1 font-sans text-[10px] tracking-wide text-fg-default uppercase">
        {status.replaceAll("_", " ")}
      </p>
      {mergedInto ? (
        <p className="mt-0.5 font-sans text-[10px] tracking-wide text-white/40">
          merged into {mergedInto}
        </p>
      ) : null}
    </div>
  );
}
