"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

const BAR_LENGTH = 10;
const DEFAULT_REDIRECT_DELAY_SECONDS = 1;
const DEFAULT_LOADING_TARGET_PERCENT = 90;

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
};

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
}: ProgressBarProps) {
  const [percent, setPercent] = useState(0);
  const percentRef = useRef(0);
  const completedRef = useRef(false);
  const isFinished = isComplete && Math.round(percent) >= 100;

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
      <p className="mb-4 font-sans text-xs tracking-[0.25em] text-black uppercase sm:text-sm">
        {eyebrow}
      </p>
      <p className="font-sans text-lg leading-snug font-medium tracking-wide text-black sm:text-xl md:text-2xl">
        {formatBar(percent)}
      </p>
      <p className="mt-4 font-sans text-sm text-black/70">
        {isFinished ? completedLabel : loadingLabel}
      </p>
    </div>
  );
}
