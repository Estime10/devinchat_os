"use client";

import { startSplashBootAnimation } from "@/lib/animation/splash/start-splash-boot-animation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Orchestration splash — logo → journal → progress (hors UI).
 */
export function useSplashScreen() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLHeadingElement>(null);
  const bootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [progressActive, setProgressActive] = useState(false);
  const [progressComplete, setProgressComplete] = useState(false);

  const handleKernelComplete = useCallback(() => {
    setProgressActive(true);
  }, []);

  const handleProgressComplete = useCallback(() => {
    setProgressComplete(true);
    const root = rootRef.current;
    if (root) {
      root.dataset.splashPhase = "settled";
    }
  }, []);

  useEffect(() => {
    if (!progressActive || progressComplete) {
      return;
    }

    const timer = window.setTimeout(() => {
      setProgressComplete(true);
    }, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [progressActive, progressComplete]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const brand = brandRef.current;
    const boot = bootRef.current;
    const progress = progressRef.current;

    if (!root || !stage || !brand || !boot || !progress) {
      return;
    }

    const lines = Array.from(
      boot.querySelectorAll<HTMLElement>("[data-splash-line]"),
    );
    const letters = Array.from(
      brand.querySelectorAll<HTMLElement>("[data-splash-letter]"),
    );

    return startSplashBootAnimation(
      {
        root,
        stage,
        brand,
        letters,
        boot,
        lines,
        progress,
      },
      { onKernelComplete: handleKernelComplete },
    );
  }, [handleKernelComplete]);

  return {
    rootRef,
    stageRef,
    brandRef,
    bootRef,
    progressRef,
    progressActive,
    progressComplete,
    handleProgressComplete,
  };
}
