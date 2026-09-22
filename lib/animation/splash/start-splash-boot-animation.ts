import { prefersReducedMotion } from "@/lib/animation/prefers-reduced-motion";
import { BRAND } from "@/lib/brand/brand";
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
  onKernelComplete: () => void;
  /** Skip explicite — arrête l’anim et enchaîne. */
  onSkip: () => void;
};

export type SplashBootAnimationControl = {
  cleanup: () => void;
  skip: () => void;
};

/** Timings — rythme d’origine (premium), skip disponible si besoin. */
const T = {
  letterIn: 0.95,
  letterStagger: 0.06,
  pauseAfterBrand: 0.7,
  stageRise: 0.85,
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
 * Cold boot : logo → journal → progress.
 * Retourne cleanup + skip (Escape / tap).
 */
export function startSplashBootAnimation(
  nodes: SplashBootAnimationNodes,
  handlers: SplashBootAnimationHandlers,
): SplashBootAnimationControl {
  const { root, stage, brand, letters, boot, lines, progress } = nodes;
  const { onKernelComplete, onSkip } = handlers;

  const viewportH = root.clientHeight || window.innerHeight;
  const brandHeight = brand.offsetHeight;
  const finalTop = Math.round(viewportH * T.finalTopRatio);
  const initialTop = Math.max(0, Math.round((viewportH - brandHeight) / 2));

  let hasSkipped = false;
  let timeline: gsap.core.Timeline | null = null;

  const clearWillChange = () => {
    stage.style.willChange = "auto";
    brand.style.willChange = "auto";
    letters.forEach((el) => {
      el.style.willChange = "auto";
    });
    lines.forEach((el) => {
      el.style.willChange = "auto";
    });
    boot.style.willChange = "auto";
    progress.style.willChange = "auto";
  };

  const poseWillChange = () => {
    stage.style.willChange = "top";
    letters.forEach((el) => {
      el.style.willChange = "transform, opacity, filter";
    });
    lines.forEach((el) => {
      el.style.willChange = "transform, opacity, filter";
    });
    boot.style.willChange = "height, margin-top";
    progress.style.willChange = "height, opacity, margin-top";
  };

  const snapToEnd = () => {
    gsap.set(stage, { top: finalTop });
    gsap.set(brand, { opacity: 1 });
    gsap.set(letters, {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "none",
      rotateX: 0,
    });
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
    clearWillChange();
  };

  const skip = () => {
    if (hasSkipped) {
      return;
    }
    hasSkipped = true;
    timeline?.kill();
    snapToEnd();
    root.dataset.splashPhase = "skipped";
    onSkip();
  };

  if (prefersReducedMotion()) {
    snapToEnd();
    root.dataset.splashPhase = "progress";
    onKernelComplete();
    return {
      cleanup: () => undefined,
      skip,
    };
  }

  const bootHeight = boot.scrollHeight;
  const progressHeight = progress.scrollHeight;
  const phosphorGlow = `0 0 18px rgba(${BRAND.phosphorRgb},0.55)`;

  const ctx = gsap.context(() => {
    poseWillChange();
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

    timeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        clearWillChange();
      },
    });

    timeline.to(
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

    const riseAt = T.letterIn + T.pauseAfterBrand;
    timeline.to(
      stage,
      {
        top: finalTop,
        duration: T.stageRise,
        ease: "power2.inOut",
      },
      riseAt,
    );

    const bootAt = riseAt + T.stageRise + T.pauseAfterRise;
    timeline.call(
      () => {
        root.dataset.splashPhase = "kernel";
      },
      undefined,
      bootAt,
    );

    timeline.to(
      boot,
      {
        height: bootHeight,
        marginTop: T.contentGap,
        duration: T.bootReveal,
        ease: "power2.out",
      },
      bootAt,
    );

    const kernelStart = bootAt + T.bootReveal * 0.12;
    lines.forEach((line, index) => {
      const at = kernelStart + index * T.lineStagger;
      timeline!.to(
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
      timeline!.fromTo(
        line,
        { textShadow: `0 0 0 rgba(${BRAND.phosphorRgb},0)` },
        {
          textShadow: phosphorGlow,
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

    timeline.call(
      () => {
        if (hasSkipped) {
          return;
        }
        root.dataset.splashPhase = "progress";
        onKernelComplete();
      },
      undefined,
      afterLog,
    );

    timeline.to(
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

  return {
    cleanup: () => {
      hasSkipped = true;
      timeline?.kill();
      clearWillChange();
      ctx.revert();
    },
    skip,
  };
}
