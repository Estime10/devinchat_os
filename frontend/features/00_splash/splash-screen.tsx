"use client";

import { ProgressBar } from "@/lib/animation/progress-bar/progress-bar";
import {
  SPLASH_BOOT_LINES,
  SPLASH_BRAND,
} from "@/lib/content/splash-boot-lines";
import { SPLASH_PROGRESS } from "@/lib/content/splash-progress";
import { useSplashScreen } from "@/lib/hooks/splash/use-splash-screen/use-splash-screen";

type SplashScreenProps = {
  isAuthenticated: boolean;
};

/**
 * Splash cold boot — logo → journal → progress → /home | /auth?mode=login.
 * Pas une surface PWA installable (pas de manifest).
 */
export function SplashScreen({ isAuthenticated }: SplashScreenProps) {
  const {
    rootRef,
    stageRef,
    brandRef,
    bootRef,
    progressRef,
    progressActive,
    progressComplete,
    handleProgressComplete,
  } = useSplashScreen(isAuthenticated);

  return (
    <main
      ref={rootRef}
      className="splash-screen"
      aria-label="DevinChat OS"
      data-splash-phase="idle"
    >
      <div className="splash-crt" aria-hidden>
        <div className="splash-crt-scanlines" />
        <div className="splash-crt-vignette" />
      </div>

      <div ref={stageRef} className="splash-stage">
        <h1 ref={brandRef} className="splash-brand" aria-label={SPLASH_BRAND}>
          {SPLASH_BRAND.split("").map((char, index) => (
            <span
              key={`${char}-${index}`}
              className={
                char === " " ? "splash-brand-space" : "splash-brand-letter"
              }
              data-splash-letter
              aria-hidden
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h1>

        <div ref={bootRef} className="splash-boot" aria-hidden>
          {SPLASH_BOOT_LINES.map((line) => (
            <p
              key={`${line.tag}-${line.text}`}
              className="splash-boot-line"
              data-splash-line
            >
              <span className="splash-boot-tag">[{line.tag}]</span>
              <span className="splash-boot-text">{line.text}</span>
            </p>
          ))}
        </div>

        <div ref={progressRef} className="splash-progress">
          <ProgressBar
            tone="default"
            isActive={progressActive}
            isComplete={progressComplete}
            onComplete={handleProgressComplete}
            eyebrow="// boot"
            loadingLabel="booting..."
            completedLabel="ready"
            loadingTargetPercent={SPLASH_PROGRESS.loadingTargetPercent}
            loadingDurationSeconds={SPLASH_PROGRESS.loadingDurationSeconds}
            completeDurationSeconds={SPLASH_PROGRESS.completeDurationSeconds}
            redirectDelaySeconds={SPLASH_PROGRESS.redirectDelaySeconds}
          />
        </div>
      </div>

      <p className="splash-skip-hint" aria-hidden>
        tap / esc to skip
      </p>
    </main>
  );
}
