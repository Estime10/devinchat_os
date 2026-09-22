import { prefersReducedMotion } from "@/lib/animation/prefers-reduced-motion";
import gsap from "gsap";

export type SplashBootAnimationNodes = {
  root: HTMLElement;
  stage: HTMLElement;
  brand: HTMLElement;
  letters: HTMLElement[];
  boot: HTMLElement;
  lines: HTMLElement[];
  progress: HTMLElement;
};

export type SplashBootAnimationHandlers = {
  /** Journal terminé — démarrer la progress bar. */
  onKernelComplete: () => void;
};

/** Timings — logo → journal → progress. */
const T = {
  letterIn: 0.95,
  letterStagger: 0.06,
  pauseAfterBrand: 0.7,
  stageRise: 0.85,
  /** Position finale du logo (fraction viewport). */
  finalTopRatio: 0.18,
  pauseAfterRise: 0.4,
  lineStagger: 0.28,
  lineIn: 0.42,
  lineFlash: 0.18,
  pauseAfterLog: 0.75,
  progressIn: 0.55,
  bootReveal: 0.55,
  contentGap: 28,
} as const;

/**
 * Cold boot : logo se parque → puis journal → puis progress.
 * Retourne une cleanup (revert context).
 */
export function startSplashBootAnimation(
  nodes: SplashBootAnimationNodes,
  handlers: SplashBootAnimationHandlers,
): () => void {
  const { root, stage, brand, letters, boot, lines, progress } = nodes;
  const { onKernelComplete } = handlers;

  const viewportH = root.clientHeight || window.innerHeight;
  const brandHeight = brand.offsetHeight;
  const finalTop = Math.round(viewportH * T.finalTopRatio);
  const initialTop = Math.max(0, Math.round((viewportH - brandHeight) / 2));

  if (prefersReducedMotion()) {
    gsap.set(stage, { top: finalTop });
    gsap.set(brand, { opacity: 1 });
    gsap.set(letters, { opacity: 1, y: 0, filter: "none" });
    gsap.set(boot, {
      opacity: 1,
      height: "auto",
      overflow: "visible",
      marginTop: T.contentGap,
    });
    gsap.set(lines, { opacity: 1, x: 0, filter: "none" });
    gsap.set(progress, {
      opacity: 1,
      height: "auto",
      overflow: "visible",
      marginTop: T.contentGap,
    });
    root.dataset.splashPhase = "progress";
    onKernelComplete();
    return () => undefined;
  }

  const bootHeight = boot.scrollHeight;
  const progressHeight = progress.scrollHeight;

  const ctx = gsap.context(() => {
    gsap.set(root, { opacity: 1 });
    gsap.set(stage, { top: initialTop });
    gsap.set(brand, { opacity: 1 });
    gsap.set(letters, {
      opacity: 0,
      y: 28,
      scale: 0.85,
      filter: "blur(8px)",
      rotateX: -40,
    });
    gsap.set(boot, {
      opacity: 1,
      height: 0,
      overflow: "hidden",
      marginTop: 0,
    });
    gsap.set(lines, {
      opacity: 0,
      x: -12,
      filter: "blur(2px)",
    });
    gsap.set(progress, {
      opacity: 0,
      height: 0,
      overflow: "hidden",
      marginTop: 0,
    });

    root.dataset.splashPhase = "brand";

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
    });

    // 1 — Logo au centre
    tl.to(
      letters,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        rotateX: 0,
        stagger: { each: T.letterStagger, from: "center" },
        duration: T.letterIn,
        ease: "power3.out",
      },
      0,
    );

    // 2 — Logo monte jusqu’à sa position finale (rien d’autre)
    const riseAt = T.letterIn + T.pauseAfterBrand;
    tl.to(
      stage,
      {
        top: finalTop,
        duration: T.stageRise,
        ease: "power2.inOut",
      },
      riseAt,
    );

    // 3 — Seulement après : journal sous le logo parque
    const bootAt = riseAt + T.stageRise + T.pauseAfterRise;
    tl.call(
      () => {
        root.dataset.splashPhase = "kernel";
      },
      undefined,
      bootAt,
    );

    tl.to(
      boot,
      {
        height: bootHeight,
        marginTop: T.contentGap,
        duration: T.bootReveal,
        ease: "power2.out",
      },
      bootAt,
    );

    const kernelStart = bootAt + T.bootReveal * 0.15;
    lines.forEach((line, index) => {
      const at = kernelStart + index * T.lineStagger;
      tl.to(
        line,
        {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          duration: T.lineIn,
          ease: "power3.out",
        },
        at,
      );
      tl.fromTo(
        line,
        { textShadow: "0 0 0 rgba(57,255,20,0)" },
        {
          textShadow: "0 0 18px rgba(57,255,20,0.55)",
          duration: T.lineFlash,
          yoyo: true,
          repeat: 1,
          ease: "none",
        },
        at,
      );
    });

    const afterLog =
      kernelStart +
      (lines.length - 1) * T.lineStagger +
      T.lineIn +
      T.pauseAfterLog;

    // 4 — Progress sous le journal
    tl.call(
      () => {
        root.dataset.splashPhase = "progress";
        onKernelComplete();
      },
      undefined,
      afterLog,
    );

    tl.to(
      progress,
      {
        height: progressHeight,
        marginTop: T.contentGap,
        opacity: 1,
        duration: T.progressIn,
        ease: "power2.out",
      },
      afterLog,
    );
  }, root);

  return () => {
    ctx.revert();
  };
}
