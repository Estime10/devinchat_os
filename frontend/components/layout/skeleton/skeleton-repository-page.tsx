import { repositoryBootProgress } from "@/frontend/components/boot/presets";
import { ProgressBar } from "@/lib/animation/progress-bar/progress-bar";

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
      <div className="flex w-full max-w-md flex-col items-center justify-center px-4">
        <ProgressBar
          isActive
          isComplete={false}
          onComplete={() => undefined}
          {...repositoryBootProgress}
          className="w-full text-center"
        />
      </div>
      <span className="sr-only">Loading repository…</span>
    </main>
  );
}
