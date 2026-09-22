import type { OwnFeature } from "@/backend/features/04_features/types/own-feature/own-feature";
import { compareByPushRecency } from "@/backend/features/04_features/domain/branch-display-order/branch-display-order";
import {
  isIntegrationBranch,
  isProductionBranch,
} from "@/backend/features/04_features/domain/resolve-branch-feature-status/resolve-branch-feature-status";

export type FeatureTreeNode = {
  feature: OwnFeature;
  children: FeatureTreeNode[];
};

export type FeatureTree = {
  root: FeatureTreeNode | null;
  /**
   * Sous-arbres hors spine trunk (ex. A mergé dans B, tous deux encore open).
   * Chaque nœud garde ses lignes enfants — pas de liste à plat.
   */
  openForest: FeatureTreeNode[];
};

function compareFeatureRecency(a: OwnFeature, b: OwnFeature): number {
  return compareByPushRecency(
    { branchName: a.branchName, lastPushedAt: a.lastPushedAt },
    { branchName: b.branchName, lastPushedAt: b.lastPushedAt },
  );
}

function latestPushMs(node: FeatureTreeNode): number {
  let latest = node.feature.lastPushedAt
    ? Date.parse(node.feature.lastPushedAt)
    : 0;
  if (!Number.isFinite(latest)) {
    latest = 0;
  }
  for (const child of node.children) {
    latest = Math.max(latest, latestPushMs(child));
  }
  return latest;
}

function compareOpenForestNodes(
  a: FeatureTreeNode,
  b: FeatureTreeNode,
): number {
  const byTime = latestPushMs(b) - latestPushMs(a);
  if (byTime !== 0) {
    return byTime;
  }
  return (a.feature.branchName ?? "").localeCompare(b.feature.branchName ?? "");
}

function sortFeatures(features: OwnFeature[]): OwnFeature[] {
  return [...features].sort(compareFeatureRecency);
}

/**
 * Prefère develop en premier sous main, puis les autres par récence.
 */
function sortSpineChildren(features: OwnFeature[]): OwnFeature[] {
  const develop: OwnFeature[] = [];
  const rest: OwnFeature[] = [];

  for (const feature of features) {
    const branch = feature.branchName ?? "";
    if (branch && isIntegrationBranch(branch)) {
      develop.push(feature);
    } else {
      rest.push(feature);
    }
  }

  return [...develop, ...sortFeatures(rest)];
}

function collectAttachedIds(node: FeatureTreeNode, into: Set<string>): void {
  into.add(node.feature.id);
  for (const child of node.children) {
    collectAttachedIds(child, into);
  }
}

/**
 * Arbre généalogique via parent_branch_name :
 * main → develop → mergés → sous-branches… + forêt open hors spine.
 */
export function buildFeatureTree(features: OwnFeature[]): FeatureTree {
  let production: OwnFeature | null = null;
  let develop: OwnFeature | null = null;
  const others: OwnFeature[] = [];

  for (const feature of features) {
    const branchName = feature.branchName ?? "";

    if (branchName && isProductionBranch(branchName)) {
      if (!production || branchName === "main") {
        production = feature;
      }
      continue;
    }

    if (branchName && isIntegrationBranch(branchName)) {
      develop = feature;
      continue;
    }

    if (!branchName && feature.status !== "done") {
      continue;
    }

    others.push(feature);
  }

  const byBranchName = new Map<string, OwnFeature>();
  if (production?.branchName) {
    byBranchName.set(production.branchName, production);
  }
  if (develop?.branchName) {
    byBranchName.set(develop.branchName, develop);
  }
  for (const feature of others) {
    if (feature.branchName) {
      byBranchName.set(feature.branchName, feature);
    }
  }

  const childrenByParent = new Map<string, OwnFeature[]>();

  const attachUnder = (parentKey: string, feature: OwnFeature) => {
    const list = childrenByParent.get(parentKey) ?? [];
    list.push(feature);
    childrenByParent.set(parentKey, list);
  };

  if (develop && production?.branchName) {
    attachUnder(production.branchName, develop);
  }

  for (const feature of others) {
    const parent = feature.parentBranchName;
    if (!parent) {
      continue;
    }

    if (byBranchName.has(parent)) {
      attachUnder(parent, feature);
      continue;
    }

    if (
      production?.branchName &&
      (isProductionBranch(parent) || isIntegrationBranch(parent))
    ) {
      const fallbackParent =
        isIntegrationBranch(parent) && develop?.branchName
          ? develop.branchName
          : production.branchName;
      attachUnder(fallbackParent, feature);
    }
  }

  function buildNode(
    feature: OwnFeature,
    ancestry: ReadonlySet<string>,
  ): FeatureTreeNode {
    const branchKey = feature.branchName;
    if (!branchKey || ancestry.has(feature.id)) {
      return { feature, children: [] };
    }

    const nextAncestry = new Set(ancestry);
    nextAncestry.add(feature.id);

    const rawChildren = childrenByParent.get(branchKey) ?? [];
    const ordered =
      production?.branchName === branchKey
        ? sortSpineChildren(rawChildren)
        : sortFeatures(rawChildren);

    return {
      feature,
      children: ordered.map((child) => buildNode(child, nextAncestry)),
    };
  }

  let root: FeatureTreeNode | null = null;
  if (production) {
    root = buildNode(production, new Set());
  } else if (develop) {
    root = buildNode(develop, new Set());
  }

  const attachedIds = new Set<string>();
  if (root) {
    collectAttachedIds(root, attachedIds);
  }

  const remaining = others.filter((feature) => !attachedIds.has(feature.id));
  const remainingIds = new Set(remaining.map((feature) => feature.id));

  // Racines de forêt : pas de parent open dans le reste.
  const forestRoots = remaining.filter((feature) => {
    const parent = feature.parentBranchName;
    if (!parent) {
      return true;
    }
    const parentFeature = byBranchName.get(parent);
    return !parentFeature || !remainingIds.has(parentFeature.id);
  });

  const openForest = sortFeatures(forestRoots).map((feature) =>
    buildNode(feature, new Set()),
  );

  // Filet : aucun open ne doit disparaître (cycles / parents orphelins).
  const coveredIds = new Set<string>();
  for (const node of openForest) {
    collectAttachedIds(node, coveredIds);
  }
  for (const feature of sortFeatures(remaining)) {
    if (!coveredIds.has(feature.id)) {
      openForest.push({ feature, children: [] });
      coveredIds.add(feature.id);
    }
  }

  // Plus récent → moins récent (activité du sous-arbre), y compris après filet.
  openForest.sort(compareOpenForestNodes);

  return { root, openForest };
}
