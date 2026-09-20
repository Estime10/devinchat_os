import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { compareByPushRecency } from "@/lib/github/branch-display-order";
import {
  isIntegrationBranch,
  isProductionBranch,
} from "@/lib/github/resolve-branch-feature-status";

export type FeaturePyramid = {
  done: OwnFeature[];
  inProgress: OwnFeature[];
  develop: OwnFeature | null;
  production: OwnFeature | null;
};

function compareFeatureRecency(a: OwnFeature, b: OwnFeature): number {
  return compareByPushRecency(
    { branchName: a.branchName, lastPushedAt: a.lastPushedAt },
    { branchName: b.branchName, lastPushedAt: b.lastPushedAt },
  );
}

/**
 * Pyramide : (main | develop) → done → in_progress.
 * Cards métier triées du plus récent au plus ancien.
 */
export function buildFeaturePyramid(features: OwnFeature[]): FeaturePyramid {
  let production: OwnFeature | null = null;
  let develop: OwnFeature | null = null;
  const others: OwnFeature[] = [];

  for (const feature of features) {
    const branchName = feature.branchName ?? "";
    if (!branchName) {
      continue;
    }

    if (isProductionBranch(branchName)) {
      if (!production || branchName === "main") {
        production = feature;
      }
      continue;
    }

    if (isIntegrationBranch(branchName)) {
      develop = feature;
      continue;
    }

    others.push(feature);
  }

  const done = others
    .filter((feature) => feature.status === "done")
    .sort(compareFeatureRecency);
  const inProgress = others
    .filter((feature) => feature.status !== "done")
    .sort(compareFeatureRecency);

  return { done, inProgress, develop, production };
}
