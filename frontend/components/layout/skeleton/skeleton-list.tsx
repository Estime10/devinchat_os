import { SkeletonLine } from "@/frontend/components/layout/skeleton/skeleton-line";

type SkeletonListProps = {
  rows?: number;
};

/**
 * Variant liste — lignes type row (features, etc.).
 */
export function SkeletonList({ rows = 6 }: SkeletonListProps) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-3"
      role="status"
      aria-busy="true"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 border-b border-glass-border/20 px-3 py-3"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="h-4 w-40 max-w-full" />
            <SkeletonLine className="h-3 w-56 max-w-full bg-white/5" />
          </div>
          <SkeletonLine className="h-3 w-16 bg-white/5" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
