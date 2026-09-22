"use client";

import { startSplashBootAnimation } from "@/lib/animation/splash/start-splash-boot-animation";
import { SPLASH_PROGRESS } from "@/lib/content/splash-progress";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** Délai avant que tap/Escape skip — évite un skip accidentel au mount. */
const SKIP_ARM_MS = 450;

/**
 * Orchestration splash — logo → journal → progress → home | auth.
 * Skip explicite uniquement (Escape / tap), après armement.
 */
export function useSplashScreen(isAuthenticated: boolean) {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLHeadingElement>(null);
  const bootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hasNavigatedRef = useRef(false);
  const skipAnimRef = useRef<(() => void) | null>(null);
  const skipArmedRef = useRef(false);

  const [progressActive, setProgressActive] = useState(false);
  const [progressComplete, setProgressComplete] = useState(false);

  const navigateAway = useCallback(() => {
    if (hasNavigatedRef.current) {
      return;
    }
    hasNavigatedRef.current = true;
    router.replace(
      isAuthenticated ? ROUTES.home : ROUTES.authWithMode("login"),
    );
  }, [isAuthenticated, router]);

  const handleKernelComplete = useCallback(() => {
    setProgressActive(true);
  }, []);

  const handleProgressComplete = useCallback(() => {
    setProgressComplete(true);
    const root = rootRef.current;
    if (root) {
      root.dataset.splashPhase = "settled";
    }
    navigateAway();
  }, [navigateAway]);

  const handleSkip = useCallback(() => {
    if (!skipArmedRef.current || hasNavigatedRef.current) {
      return;
    }
    if (skipAnimRef.current) {
      skipAnimRef.current();
      return;
    }
    navigateAway();
  }, [navigateAway]);

  useEffect(() => {
    skipArmedRef.current = false;
    const armTimer = window.setTimeout(() => {
      skipArmedRef.current = true;
    }, SKIP_ARM_MS);

    return () => {
      window.clearTimeout(armTimer);
    };
  }, []);

  useEffect(() => {
    if (!progressActive || progressComplete) {
      return;
    }

    const timer = window.setTimeout(() => {
      setProgressComplete(true);
    }, SPLASH_PROGRESS.completeAfterMs);

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

    const control = startSplashBootAnimation(
      {
        root,
        stage,
        brand,
        letters,
        boot,
        lines,
        progress,
      },
      {
        onKernelComplete: handleKernelComplete,
        onSkip: () => {
          setProgressActive(true);
          setProgressComplete(true);
          navigateAway();
        },
      },
    );

    skipAnimRef.current = control.skip;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleSkip();
      }
    };

    const onPointer = () => {
      handleSkip();
    };

    window.addEventListener("keydown", onKeyDown);
    root.addEventListener("pointerdown", onPointer);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("pointerdown", onPointer);
      skipAnimRef.current = null;
      control.cleanup();
    };
  }, [handleKernelComplete, handleSkip, navigateAway]);

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
