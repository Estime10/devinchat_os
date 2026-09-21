"use client";

import { AuthProgressBar } from "@/lib/animation/progress-bar/variants/auth";
import { useAuthQuotesPanel } from "@/lib/hooks/authentification/use-auth-quotes-panel";

type AuthQuotesPanelProps = {
  isRegistering: boolean;
  isSuccess: boolean;
  onProgressComplete: () => void;
};

/**
 * Présentation panneau quotes / barre — état dans useAuthQuotesPanel.
 */
export function AuthQuotesPanel({
  isRegistering,
  isSuccess,
  onProgressComplete,
}: AuthQuotesPanelProps) {
  const showProgress = isRegistering || isSuccess;
  const { textRef, cursorRef } = useAuthQuotesPanel(showProgress);

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
