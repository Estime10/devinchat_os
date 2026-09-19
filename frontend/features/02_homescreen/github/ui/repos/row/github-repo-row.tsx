import { Sparkline } from "@/frontend/components/ui/sparkline/sparkline";

type GithubRepoRowProps = {
  fullName: string;
  htmlUrl: string;
  createdAtLabel: string | null;
  pushedAtLabel: string;
  weeklyCommits: number[] | null;
  isActivityLoading?: boolean;
};

/**
 * Ligne repo — remplit la hauteur allouée dans la colonne.
 */
export function GithubRepoRow({
  fullName,
  htmlUrl,
  createdAtLabel,
  pushedAtLabel,
  weeklyCommits,
  isActivityLoading = false,
}: GithubRepoRowProps) {
  return (
    <a
      href={htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full w-full items-center rounded-none border-b border-glass-border/40 px-3 py-3 transition-colors hover:bg-fg-default/10"
    >
      <div className="flex w-full items-center justify-between gap-5">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate font-sans text-base leading-snug text-white">
            {fullName}
          </p>
          {createdAtLabel ? (
            <p className="font-sans text-sm leading-snug text-white/50 uppercase">
              {createdAtLabel}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className="font-sans text-xs leading-none text-white/50 uppercase tabular-nums">
            {pushedAtLabel}
          </p>
          {isActivityLoading ? (
            <span className="font-sans text-xs text-white/30 uppercase">…</span>
          ) : weeklyCommits ? (
            <span className="text-fg-default">
              <Sparkline values={weeklyCommits} width={96} height={24} />
            </span>
          ) : (
            <span className="font-sans text-xs text-white/30 uppercase">
              n/a
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
