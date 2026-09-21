import { prefersReducedMotion } from "@/lib/animation/prefers-reduced-motion";
import gsap from "gsap";

const CHAR_DURATION = 0.035;
const HOLD_DURATION = 2.4;
const CLEAR_PAUSE = 0.35;

export type AuthQuotesAnimationInput = {
  textNode: HTMLElement;
  cursorNode: HTMLElement;
  pickQuote: (lastQuote: string) => string;
};

/**
 * Typewriter + curseur clignotant pour le panneau auth quotes.
 * Retourne une cleanup.
 */
export function startAuthQuotesAnimation(
  input: AuthQuotesAnimationInput,
): () => void {
  const { textNode, cursorNode, pickQuote } = input;

  if (prefersReducedMotion()) {
    textNode.textContent = pickQuote("");
    cursorNode.style.opacity = "0";
    return () => undefined;
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

      const quote = pickQuote(lastQuote);
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
}
