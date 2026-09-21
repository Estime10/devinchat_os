import { prefersReducedMotion } from "@/lib/animation/prefers-reduced-motion";
import gsap from "gsap";

/**
 * Entrée liste repos après changement de page.
 */
export function animateReposListEnter(list: HTMLElement): void {
  if (prefersReducedMotion()) {
    return;
  }

  gsap.fromTo(
    list,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" },
  );
}

/**
 * Sortie liste repos avant changement de page.
 */
export function animateReposListExit(
  list: HTMLElement,
  onComplete: () => void,
): void {
  if (prefersReducedMotion()) {
    onComplete();
    return;
  }

  gsap.to(list, {
    opacity: 0,
    y: -8,
    duration: 0.16,
    ease: "power2.in",
    onComplete,
  });
}
