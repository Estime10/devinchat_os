export type OwnFeature = {
  id: string;
  name: string;
  branchName: string | null;
  parentBranchName: string | null;
  status: string;
  lastPushedAt: string | null;
  tipCommitSha: string | null;
};
