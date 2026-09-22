import { Sparkline } from "@/frontend/components/ui/sparkline/sparkline/sparkline";
import { SparklineSkeleton } from "@/frontend/components/ui/sparkline/sparkline-skeleton/sparkline-skeleton";
import Link from "next/link";

type GithubRepoRowProps = {
  fullName: string;
  href: string;
  createdAtLabel: string | null;
  pushedAtLabel: string;
  weeklyCommits: number[] | null;
  isActivityLoading?: boolean;
};

/**
 * Ligne repo — navigue vers le detail app (features).
 */
export function GithubRepoRow({
  fullName,
  href,
  createdAtLabel,
  pushedAtLabel,
  weeklyCommits,
  isActivityLoading = false,
}: GithubRepoRowProps) {
  return (
    <Link
      href={href}
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
            <SparklineSkeleton />
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
    </Link>
  );
}
