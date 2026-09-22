"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

const BAR_LENGTH = 10;
const DEFAULT_REDIRECT_DELAY_SECONDS = 1;
const DEFAULT_LOADING_TARGET_PERCENT = 90;

export type ProgressBarTone = "on-light" | "default";

export type ProgressBarProps = {
  isActive: boolean;
  isComplete: boolean;
  onComplete: () => void;
  eyebrow?: string;
  loadingLabel?: string;
  completedLabel?: string;
  className?: string;
  redirectDelaySeconds?: number;
  loadingTargetPercent?: number;
  /** Auth panel clair (`on-light`) vs tokens app (`default`). */
  tone?: ProgressBarTone;
};

const TONE_CLASSNAMES: Record<
  ProgressBarTone,
  { eyebrow: string; bar: string; label: string }
> = {
  "on-light": {
    eyebrow: "progress-bar-eyebrow-on-light",
    bar: "progress-bar-value-on-light",
    label: "progress-bar-label-on-light",
  },
  default: {
    eyebrow: "progress-bar-eyebrow-default",
    bar: "progress-bar-value-default",
    label: "progress-bar-label-default",
  },
};

/** Stable no-op for skeletons / non-interactive bars (avoids GSAP effect churn). */
export function noopProgressComplete(): void {}

function formatBar(percent: number): string {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const filled = Math.round((clamped / 100) * BAR_LENGTH);
  const empty = BAR_LENGTH - filled;
  return `${"█".repeat(filled)}${"░".repeat(empty)} ${clamped}%`;
}

/**
 * Progress bar terminal réutilisable (GSAP).
 * Actif → monte vers loadingTargetPercent. Complete → 100% → onComplete après délai.
 */
export function ProgressBar({
  isActive,
  isComplete,
  onComplete,
  eyebrow = "// progress",
  loadingLabel = "loading...",
  completedLabel = "completed",
  className = "",
  redirectDelaySeconds = DEFAULT_REDIRECT_DELAY_SECONDS,
  loadingTargetPercent = DEFAULT_LOADING_TARGET_PERCENT,
  tone = "on-light",
}: ProgressBarProps) {
  const [percent, setPercent] = useState(0);
  const percentRef = useRef(0);
  const completedRef = useRef(false);
  const isFinished = isComplete && Math.round(percent) >= 100;
  const tones = TONE_CLASSNAMES[tone];

  useEffect(() => {
    percentRef.current = percent;
  }, [percent]);

  useEffect(() => {
    const proxy = { value: percentRef.current };
    let redirectDelay: gsap.core.Tween | undefined;

    const syncPercent = () => {
      percentRef.current = proxy.value;
      setPercent(proxy.value);
    };

    const finish = () => {
      if (completedRef.current) {
        return;
      }
      completedRef.current = true;
      proxy.value = 100;
      syncPercent();
      redirectDelay = gsap.delayedCall(redirectDelaySeconds, onComplete);
    };

    if (!isActive && !isComplete) {
      completedRef.current = false;
      const resetTween = gsap.to(proxy, {
        value: 0,
        duration: 0.2,
        onUpdate: syncPercent,
      });
      return () => {
        resetTween.kill();
      };
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      proxy.value = isComplete ? 100 : loadingTargetPercent;
      syncPercent();
      if (isComplete) {
        finish();
      }
      return () => {
        redirectDelay?.kill();
      };
    }

    const tween = gsap.to(proxy, {
      value: isComplete ? 100 : loadingTargetPercent,
      duration: isComplete ? 0.55 : 6,
      ease: isComplete ? "power2.out" : "power1.out",
      onUpdate: syncPercent,
      onComplete: () => {
        if (isComplete) {
          finish();
        }
      },
    });

    return () => {
      tween.kill();
      redirectDelay?.kill();
    };
  }, [
    isActive,
    isComplete,
    onComplete,
    redirectDelaySeconds,
    loadingTargetPercent,
  ]);

  return (
    <div
      className={`relative z-10 ${className}`.trim()}
      aria-live="polite"
      aria-busy={isActive}
    >
      <p className={tones.eyebrow}>{eyebrow}</p>
      <p className={tones.bar}>{formatBar(percent)}</p>
      <p className={tones.label}>
        {isFinished ? completedLabel : loadingLabel}
      </p>
    </div>
  );
}
