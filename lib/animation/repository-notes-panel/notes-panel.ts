import { prefersReducedMotion } from "@/lib/animation/prefers-reduced-motion";
import gsap from "gsap";

const OPEN_GAP = 56;
const ANIM_DURATION = 0.68;
const ANIM_EASE = "power3.inOut";

export type NotesPanelElements = {
  shell: HTMLElement;
  notesPanel: HTMLElement;
  notesInner: HTMLElement;
};

export function measureNotesPanelWidth(shell: HTMLElement): number {
  return Math.max(0, Math.floor((shell.clientWidth - OPEN_GAP) / 2));
}

/**
 * État initial panneau notes (fermé).
 */
export function initNotesPanel(elements: {
  notesPanel: HTMLElement;
  notesInner: HTMLElement;
}): void {
  gsap.set(elements.notesPanel, { width: 0 });
  gsap.set(elements.notesInner, { autoAlpha: 0 });
}

/**
 * Ouvre le panneau notes (width → ~50%).
 */
export function openNotesPanel(input: {
  elements: NotesPanelElements;
  onComplete?: () => void;
}): gsap.core.Timeline | null {
  const { shell, notesPanel, notesInner } = input.elements;
  const targetWidth = measureNotesPanelWidth(shell);

  if (prefersReducedMotion()) {
    gsap.set(notesPanel, { width: targetWidth });
    gsap.set(notesInner, { width: targetWidth, autoAlpha: 1 });
    input.onComplete?.();
    return null;
  }

  gsap.set(notesInner, { width: targetWidth });

  return gsap
    .timeline({
      defaults: { ease: ANIM_EASE },
      onComplete: input.onComplete,
    })
    .to(notesPanel, { width: targetWidth, duration: ANIM_DURATION }, 0)
    .to(notesInner, { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 0.2);
}

/**
 * Ferme le panneau notes (width → 0).
 */
export function closeNotesPanel(input: {
  elements: Pick<NotesPanelElements, "notesPanel" | "notesInner">;
  onComplete?: () => void;
}): gsap.core.Timeline | null {
  const { notesPanel, notesInner } = input.elements;

  if (prefersReducedMotion()) {
    gsap.set(notesInner, { autoAlpha: 0 });
    gsap.set(notesPanel, { width: 0 });
    input.onComplete?.();
    return null;
  }

  return gsap
    .timeline({
      defaults: { ease: ANIM_EASE },
      onComplete: input.onComplete,
    })
    .to(notesInner, { autoAlpha: 0, duration: 0.28, ease: "power2.in" }, 0)
    .to(notesPanel, { width: 0, duration: ANIM_DURATION }, 0.06);
}

/**
 * Crossfade du contenu notes (changement de branche).
 */
export function switchNotesPanelContent(input: {
  notesInner: HTMLElement;
  onSwap: () => void;
}): gsap.core.Timeline | null {
  const { notesInner, onSwap } = input;

  if (prefersReducedMotion()) {
    onSwap();
    return null;
  }

  return gsap
    .timeline()
    .to(notesInner, {
      autoAlpha: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: onSwap,
    })
    .to(notesInner, {
      autoAlpha: 1,
      duration: 0.28,
      ease: "power2.out",
    });
}

export function killNotesPanelTimeline(
  timeline: gsap.core.Timeline | null,
): void {
  timeline?.kill();
}
