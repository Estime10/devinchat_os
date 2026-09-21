"use client";

import { revealBootContent } from "@/lib/animation/boot/reveal-boot-content";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export const BootReadyContext = createContext<(() => void) | null>(null);

/**
 * État boot générique — ready → barre 100% → reveal contenu.
 */
export function useBoot() {
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const markReady = useCallback(() => {
    setReady(true);
  }, []);

  const onBootComplete = useCallback(() => {
    setRevealed(true);
  }, []);

  useEffect(() => {
    if (!revealed) {
      return;
    }

    const root = contentRef.current;
    if (!root) {
      return;
    }

    return revealBootContent(root);
  }, [revealed]);

  return {
    ready,
    revealed,
    contentRef,
    markReady,
    onBootComplete,
  };
}

/**
 * Au mount : signale au Boot que les data (ex. RSC) sont prêtes.
 */
export function useBootReadySignal() {
  const markReady = useContext(BootReadyContext);

  useEffect(() => {
    markReady?.();
  }, [markReady]);
}
