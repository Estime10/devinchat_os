import { prefersReducedMotion } from "@/lib/animation/prefers-reduced-motion";
import gsap from "gsap";

/**
 * Reveal fade/slide du contenu repo après la barre de boot.
 * Retourne une cleanup (revert context).
 */
export function revealRepositoryContent(root: HTMLElement): () => void {
  if (prefersReducedMotion()) {
    root.style.opacity = "1";
    return () => undefined;
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
}
