import { RepositoryProgressBar } from "@/lib/animation/progress-bar/variants/repository";

/**
 * Fallback Suspense portfolio — barre de boot centrée uniquement.
 */
export function SkeletonRepositoryPage() {
  return (
    <main
      className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden py-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <RepositoryProgressBar isLoading isReady={false} />
      <span className="sr-only">Loading repository…</span>
    </main>
  );
}
