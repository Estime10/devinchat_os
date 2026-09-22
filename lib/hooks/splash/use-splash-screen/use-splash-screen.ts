"use client";

import { startSplashBootAnimation } from "@/lib/animation/splash/start-splash-boot-animation";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Orchestration splash — logo → journal → progress → home | auth.
 * La session est résolue côté serveur (prop) — pas de client Supabase ici.
 */
export function useSplashScreen(isAuthenticated: boolean) {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLHeadingElement>(null);
  const bootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hasNavigatedRef = useRef(false);

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

    if (hasNavigatedRef.current) {
      return;
    }
    hasNavigatedRef.current = true;

    router.replace(
      isAuthenticated ? ROUTES.home : ROUTES.authWithMode("login"),
    );
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!progressActive || progressComplete) {
      return;
    }

    const timer = window.setTimeout(() => {
      setProgressComplete(true);
    }, 1100);

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
