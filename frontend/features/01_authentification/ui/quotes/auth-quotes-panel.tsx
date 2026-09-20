"use client";

import { AuthProgressBar } from "@/lib/animation/progress-bar/variants/auth";
import { pickRandomAuthQuote } from "@/frontend/features/01_authentification/ui/quotes/auth-quotes";
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
      className="auth-split-quotes"
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
          <p className="progress-bar-eyebrow-on-light">{"// stream"}</p>
          <p
            ref={textRef}
            className="progress-bar-value-on-light min-h-[8rem]"
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
