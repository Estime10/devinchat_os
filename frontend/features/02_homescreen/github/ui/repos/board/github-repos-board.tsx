import {
  GithubRepoColumn,
  type GithubRepoListItem,
} from "@/frontend/features/02_homescreen/github/ui/repos/column/github-repo-column";

type GithubReposBoardProps = {
  privateRepos: GithubRepoListItem[];
  publicRepos: GithubRepoListItem[];
};

/**
 * Board repos — compose private | public (aucune logique métier).
 */
export function GithubReposBoard({
  privateRepos,
  publicRepos,
}: GithubReposBoardProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <p className="font-sans text-xs tracking-[0.2em] text-white uppercase">
        {"// repositories"}
      </p>

      <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <GithubRepoColumn
          title="private"
          repos={privateRepos}
          emptyLabel="No private repositories."
        />
        <GithubRepoColumn
          title="public"
          repos={publicRepos}
          emptyLabel="No public repositories."
        />
      </div>
    </div>
  );
}
