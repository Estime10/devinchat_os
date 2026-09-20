import { SkeletonLine } from "@/frontend/components/layout/skeleton/skeleton-line";

type SkeletonReposBoardProps = {
  rows?: number;
};

/**
 * Variant board repos — 2 colonnes (homescreen).
 */
export function SkeletonReposBoard({ rows = 5 }: SkeletonReposBoardProps) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="shrink-0 font-sans text-xs tracking-[0.2em] text-white/40 uppercase">
        {"// repositories"}
      </p>

      <div className="grid min-h-0 flex-1 gap-8 overflow-hidden lg:grid-cols-2 lg:gap-14">
        <ColumnSkeleton title="private" rows={rows} />
        <ColumnSkeleton title="public" rows={rows} />
      </div>

      <span className="sr-only">Loading repositories…</span>
    </div>
  );
}

function ColumnSkeleton({ title, rows }: { title: string; rows: number }) {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <header className="mb-4 flex shrink-0 items-baseline justify-between gap-3 border-b border-glass-border pb-4">
        <h2 className="font-sans text-base font-semibold tracking-tight text-fg-default/40 uppercase">
          {title}
        </h2>
        <span className="font-sans text-sm text-white/20 tabular-nums">—</span>
      </header>

      <ul className="flex min-h-0 flex-1 flex-col">
        {Array.from({ length: rows }, (_, index) => (
          <li
            key={index}
            className="flex min-h-0 flex-1 items-center border-b border-glass-border/20 px-3 py-3 last:border-b-0"
          >
            <div className="w-full space-y-2">
              <SkeletonLine className="h-4 w-2/3 max-w-xs" />
              <SkeletonLine className="h-3 w-1/3 max-w-[8rem] bg-white/5" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
