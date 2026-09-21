"use client";

import { pickRandomAuthQuote } from "@/frontend/features/01_authentification/ui/quotes/auth-quotes";
import { startAuthQuotesAnimation } from "@/lib/animation/auth-quotes/start-auth-quotes-animation";
import { AuthProgressBar } from "@/lib/animation/progress-bar/variants/auth";
import { useEffect, useRef } from "react";

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

    return startAuthQuotesAnimation({
      textNode,
      cursorNode,
      pickQuote: pickRandomAuthQuote,
    });
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
