import type { BootProgressProps } from "@/frontend/components/boot/boot";

/** Labels / timing boot portfolio repository. */
export const repositoryBootProgress = {
  eyebrow: "// boot",
  loadingLabel: "mounting repository...",
  completedLabel: "boot completed",
  tone: "default",
  loadingTargetPercent: 88,
  redirectDelaySeconds: 0.35,
} as const satisfies BootProgressProps;
