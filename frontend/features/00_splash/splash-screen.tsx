"use client";

import { ProgressBar } from "@/lib/animation/progress-bar/progress-bar";
import {
  SPLASH_BOOT_LINES,
  SPLASH_BRAND,
} from "@/lib/content/splash-boot-lines";
import { useSplashScreen } from "@/lib/hooks/splash/use-splash-screen/use-splash-screen";

/**
 * Splash PWA — logo → journal → progress.
 * Pas de redirect post-settle (preview / tuning).
 */
export function SplashScreen() {
  const {
    rootRef,
    stageRef,
    brandRef,
    bootRef,
    progressRef,
    progressActive,
    progressComplete,
    handleProgressComplete,
  } = useSplashScreen();

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
            loadingLabel="loading os..."
            completedLabel="ready"
            loadingTargetPercent={90}
            loadingDurationSeconds={2}
            completeDurationSeconds={0.5}
            redirectDelaySeconds={0.4}
          />
        </div>
      </div>
    </main>
  );
}
