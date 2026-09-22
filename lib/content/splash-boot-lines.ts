export const SPLASH_BRAND = "DevinChat OS";

export type SplashBootLine = {
  /** Préfixe style journal systemd. */
  tag: string;
  text: string;
};

/**
 * Journal décoratif — cold boot Progress OS (pas d’info réelle).
 */
export const SPLASH_BOOT_LINES: readonly SplashBootLine[] = [
  { tag: "mount", text: "fs://devinchat" },
  { tag: "sync", text: "github://identity" },
  { tag: "load", text: "kernel/progress.tree" },
  { tag: "map", text: "branches → features" },
  { tag: "link", text: "notes ↔ commits" },
  { tag: "boot", text: "session shell" },
  { tag: "ok", text: "ready." },
] as const;
