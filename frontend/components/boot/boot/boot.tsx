"use client";

import {
  ProgressBar,
  type ProgressBarTone,
} from "@/lib/animation/progress-bar/progress-bar";
import {
  BootReadyContext,
  useBoot,
  useBootReadySignal,
} from "@/lib/hooks/boot/use-boot";
import type { ReactNode } from "react";

export type BootProgressProps = {
  eyebrow?: string;
  loadingLabel?: string;
  completedLabel?: string;
  tone?: ProgressBarTone;
  loadingTargetPercent?: number;
  redirectDelaySeconds?: number;
};

type BootProps = BootProgressProps & {
  children: ReactNode;
};

/**
 * Shell boot réutilisable — barre centrée pendant le chargement, puis reveal enfants.
 */
export function Boot({
  children,
  eyebrow = "// boot",
  loadingLabel = "loading...",
  completedLabel = "boot completed",
  tone = "default",
  loadingTargetPercent = 88,
  redirectDelaySeconds = 0.35,
}: BootProps) {
  const { ready, revealed, contentRef, markReady, onBootComplete } = useBoot();

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      {!revealed ? (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
          <div className="flex w-full max-w-md flex-col items-center justify-center px-4">
            <ProgressBar
              isActive={!ready}
              isComplete={ready}
              onComplete={onBootComplete}
              tone={tone}
              eyebrow={eyebrow}
              loadingLabel={loadingLabel}
              completedLabel={completedLabel}
              loadingTargetPercent={loadingTargetPercent}
              redirectDelaySeconds={redirectDelaySeconds}
              className="w-full text-center"
            />
          </div>
        </div>
      ) : null}

      <div
        ref={contentRef}
        className={
          revealed ? "flex min-h-0 w-full flex-1 flex-col opacity-0" : "hidden"
        }
      >
        <BootReadyContext.Provider value={markReady}>
          {children}
        </BootReadyContext.Provider>
      </div>
    </div>
  );
}

/**
 * Signal data prêtes (ex. RSC monté) → barre à 100%.
 */
export function BootReady() {
  useBootReadySignal();
  return null;
}
