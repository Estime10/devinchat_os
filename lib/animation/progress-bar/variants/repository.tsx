"use client";

import { ProgressBar } from "@/lib/animation/progress-bar/progress-bar";

type RepositoryProgressBarProps = {
  isLoading: boolean;
  isReady: boolean;
  onComplete?: () => void;
};

/**
 * Variante portfolio — boot dépôt centré (tokens fg-default).
 */
export function RepositoryProgressBar({
  isLoading,
  isReady,
  onComplete = () => undefined,
}: RepositoryProgressBarProps) {
  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center px-4">
      <ProgressBar
        isActive={isLoading}
        isComplete={isReady}
        onComplete={onComplete}
        tone="default"
        eyebrow="// boot"
        loadingLabel="mounting repository..."
        completedLabel="boot completed"
        loadingTargetPercent={88}
        redirectDelaySeconds={0.35}
        className="w-full text-center"
      />
    </div>
  );
}
