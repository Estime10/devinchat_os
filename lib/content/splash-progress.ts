const LOADING_DURATION_SECONDS = 1;
/** Petit beat après 90% avant snap → ready. */
const COMPLETE_BEAT_MS = 100;

/**
 * Timings progress splash — source unique (UI ProgressBar + hook).
 */
export const SPLASH_PROGRESS = {
  loadingTargetPercent: 90,
  loadingDurationSeconds: LOADING_DURATION_SECONDS,
  completeDurationSeconds: 0.35,
  /** Hold sur « ready » avant redirect. */
  redirectDelaySeconds: 0.5,
  /** Déclenche isComplete après la montée loading. */
  completeAfterMs: LOADING_DURATION_SECONDS * 1000 + COMPLETE_BEAT_MS,
} as const;
