"use client";

import { startAuthQuotesAnimation } from "@/lib/animation/auth-quotes/start-auth-quotes-animation";
import { pickRandomAuthQuote } from "@/lib/content/auth-quotes";
import { useEffect, useRef } from "react";

/**
 * Orchestration panneau quotes auth — hors UI.
 */
export function useAuthQuotesPanel(showProgress: boolean) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

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

  return { textRef, cursorRef };
}
