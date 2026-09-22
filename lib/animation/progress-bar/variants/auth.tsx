"use client";

import { ProgressBar } from "@/lib/animation/progress-bar/progress-bar";

type AuthProgressBarProps = {
  isRegistering: boolean;
  isSuccess: boolean;
  onComplete: () => void;
};

/**
 * Variante auth de ProgressBar — labels boot / session.
 */
export function AuthProgressBar({
  isRegistering,
  isSuccess,
  onComplete,
}: AuthProgressBarProps) {
  return (
    <ProgressBar
      isActive={isRegistering}
      isComplete={isSuccess}
      onComplete={onComplete}
      eyebrow="// boot"
      loadingLabel="initializing account..."
      completedLabel="boot completed"
    />
  );
}
