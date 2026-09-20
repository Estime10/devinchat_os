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

  const timeA = a.lastPushedAt ? Date.parse(a.lastPushedAt) : 0;
  const timeB = b.lastPushedAt ? Date.parse(b.lastPushedAt) : 0;
  return timeB - timeA;
}
