"use client";

import { RepositoryProgressBar } from "@/lib/animation/progress-bar/variants/repository";
import gsap from "gsap";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const RepositoryBootReadyContext = createContext<(() => void) | null>(null);

type RepositoryBootProps = {
  children: ReactNode;
};

/**
 * Une seule barre centrée : in progress pendant le fetch, 100% = data prêtes, puis reveal.
 */
export function RepositoryBoot({ children }: RepositoryBootProps) {
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

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      root.style.opacity = "1";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        root,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
      );
    }, root);

    return () => {
      ctx.revert();
    };
  }, [revealed]);

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      {!revealed ? (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
          <RepositoryProgressBar
            isLoading={!ready}
            isReady={ready}
            onComplete={onBootComplete}
          />
        </div>
      ) : null}

      <div
        ref={contentRef}
        className={
          revealed ? "flex min-h-0 w-full flex-1 flex-col opacity-0" : "hidden"
        }
      >
        <RepositoryBootReadyContext.Provider value={markReady}>
          {children}
        </RepositoryBootReadyContext.Provider>
      </div>
    </div>
  );
}

/**
 * Signal RSC : data montées → passe la barre à ready (100%).
 */
export function RepositoryBootReady() {
  const markReady = useContext(RepositoryBootReadyContext);

  useEffect(() => {
    markReady?.();
  }, [markReady]);

  return null;
}
