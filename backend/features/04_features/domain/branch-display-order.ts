/**
 * Rang d’affichage : main → master → develop → autres.
 */
export function branchDisplayRank(branchName: string): number {
  if (branchName === "main") {
    return 0;
  }
  if (branchName === "master") {
    return 1;
  }
  if (branchName === "develop") {
    return 2;
  }
  return 3;
}

type BranchOrderItem = {
  branchName: string | null;
  lastPushedAt: string | null;
};

function pushTimeMs(lastPushedAt: string | null): number {
  if (!lastPushedAt) {
    return 0;
  }
  const parsed = Date.parse(lastPushedAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Même rang : push les plus récents d’abord, puis nom de branche.
 */
export function compareByPushRecency(
  a: BranchOrderItem,
  b: BranchOrderItem,
): number {
  const byTime = pushTimeMs(b.lastPushedAt) - pushTimeMs(a.lastPushedAt);
  if (byTime !== 0) {
    return byTime;
  }
  return (a.branchName ?? "").localeCompare(b.branchName ?? "");
}

/**
 * main/master/develop d’abord, puis push les plus récents.
 */
export function compareByBranchPushOrder(
  a: BranchOrderItem,
  b: BranchOrderItem,
): number {
  const rankA = branchDisplayRank(a.branchName ?? "");
  const rankB = branchDisplayRank(b.branchName ?? "");
  if (rankA !== rankB) {
    return rankA - rankB;
  }

  return compareByPushRecency(a, b);
}
