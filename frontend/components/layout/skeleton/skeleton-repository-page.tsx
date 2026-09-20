import { SkeletonLine } from "@/frontend/components/layout/skeleton/skeleton-line";
import { SkeletonList } from "@/frontend/components/layout/skeleton/skeleton-list";

/**
 * Variant page repository — header + liste features.
 */
export function SkeletonRepositoryPage() {
  return (
    <main
      className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden py-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="shrink-0 space-y-3">
        <SkeletonLine className="h-3 w-16 bg-white/5" />
        <SkeletonLine className="h-7 w-64 max-w-full" />
        <SkeletonLine className="h-4 w-40 bg-white/5" />
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <p className="mb-4 shrink-0 font-sans text-xs tracking-[0.2em] text-white/40 uppercase">
          {"// features"}
        </p>
        <SkeletonList />
      </section>

      <span className="sr-only">Loading repository…</span>
    </main>
  );
}
