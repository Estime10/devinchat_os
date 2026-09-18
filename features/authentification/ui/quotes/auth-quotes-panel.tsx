"use client";

import { AuthProgressBar } from "@/lib/animation/progress-bar/variants/auth";
import { pickRandomAuthQuote } from "@/features/authentification/ui/quotes/auth-quotes";
import gsap from "gsap";
import { useEffect, useRef } from "react";

const CHAR_DURATION = 0.035;
const HOLD_DURATION = 2.4;
const CLEAR_PAUSE = 0.35;

type AuthQuotesPanelProps = {
  isRegistering: boolean;
  isSuccess: boolean;
  onProgressComplete: () => void;
};

/**
 * Panneau 30% — stream de quotes, ou barre de progression pendant le register.
 */
export function AuthQuotesPanel({
  isRegistering,
  isSuccess,
  onProgressComplete,
}: AuthQuotesPanelProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const showProgress = isRegistering || isSuccess;

  useEffect(() => {
    if (showProgress) {
      return;
    }

    const textNode = textRef.current;
    const cursorNode = cursorRef.current;
    if (!textNode || !cursorNode) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      textNode.textContent = pickRandomAuthQuote();
      cursorNode.style.opacity = "0";
      return;
    }

    let lastQuote = "";
    let isCancelled = false;
    const ctx = gsap.context(() => {
      gsap.to(cursorNode, {
        opacity: 0,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "steps(1)",
      });

      const runCycle = () => {
        if (isCancelled) {
          return;
        }

        const quote = pickRandomAuthQuote(lastQuote);
        lastQuote = quote;
        textNode.textContent = "";

        const timeline = gsap.timeline({
          onComplete: () => {
            if (!isCancelled) {
              gsap.delayedCall(CLEAR_PAUSE, runCycle);
            }
          },
        });

        quote.split("").forEach((char, index) => {
          timeline.call(
            () => {
              textNode.textContent = `${textNode.textContent ?? ""}${char}`;
            },
            undefined,
            index * CHAR_DURATION,
          );
        });

        timeline.to({}, { duration: HOLD_DURATION });
        timeline.call(() => {
          textNode.textContent = "";
        });
      };

      runCycle();
    });

    return () => {
      isCancelled = true;
      ctx.revert();
    };
  }, [showProgress]);

  return (
    <section
      className="relative z-0 flex h-full w-[30%] flex-col justify-center border-l border-glass-border bg-fg-default/55 px-5 py-8 sm:px-6"
      aria-label="Authentification secondaire"
      aria-live="polite"
    >
      {showProgress ? (
        <AuthProgressBar
          isRegistering={isRegistering}
          isSuccess={isSuccess}
          onComplete={onProgressComplete}
        />
      ) : (
        <div className="relative z-10">
          <p className="mb-4 font-sans text-xs tracking-[0.25em] text-black uppercase sm:text-sm">
            {"// stream"}
          </p>
          <p
            ref={textRef}
            className="min-h-[8rem] font-sans text-lg leading-snug font-medium text-black sm:text-xl md:text-2xl"
          />
          <span
            ref={cursorRef}
            aria-hidden
            className="mt-2 inline-block h-5 w-2.5 bg-black"
          />
        </div>
      )}
    </section>
  );
}
