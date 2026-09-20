import { isGithubConnectionActive } from "@/backend/features/02_github/domain/is-github-connection-active";
import { resolveGithubOAuthError } from "@/backend/features/02_github/messages/resolve-github-oauth-error";
import {
  getOwnGithubCommitActivity,
  type GithubCommitActivityMap,
} from "@/backend/features/02_github/services/get-own-github-commit-activity";
import { getOwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection";
import {
  listOwnGithubRepos,
  type OwnGithubRepos,
} from "@/backend/features/02_github/services/list-own-github-repos";
import { StateError } from "@/frontend/components/states/error/state-error";
import { ConnectGithubPanel } from "@/frontend/features/02_homescreen/github/ui/panel/connect-github-panel";
import { GithubReposBoard } from "@/frontend/features/02_homescreen/github/ui/repos/board/github-repos-board";
import { REPOS_PAGE_SIZE } from "@/frontend/features/02_homescreen/github/ui/repos/repos-page-size";
import { SuspenseStream } from "@/frontend/components/async/suspense-stream";
import { Skeleton } from "@/frontend/components/layout/skeleton/skeleton";
import { ROUTES } from "@/lib/routes";
import { redirect } from "next/navigation";

type GithubScreenProps = {
  oauthErrorCode?: string;
};

/**
 * Orchestrateur feature GitHub — badge vit dans le Header.
 * Liste puis sparklines en Suspense imbriqué (skeleton → repos → trends).
 */
export async function GithubScreen({ oauthErrorCode }: GithubScreenProps) {
  const connection = await getOwnGithubConnection();
  const errorMessage = resolveGithubOAuthError(oauthErrorCode);

  if (!isGithubConnectionActive(connection)) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden py-10">
        <ConnectGithubPanel errorMessage={errorMessage} />
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden py-5">
      <SuspenseStream fallback={<Skeleton variant="repos-board" />}>
        <GithubReposSection oauthErrorCode={oauthErrorCode} />
      </SuspenseStream>
    </main>
  );
}

async function GithubReposSection({
  oauthErrorCode,
}: {
  oauthErrorCode?: string;
}) {
  const result = await listOwnGithubRepos();

  // Token mort : status → expired, recharge home (panel connect + message).
  if (result.kind === "unauthorized") {
    // Évite une boucle si le mark DB a échoué et qu’on est déjà en ?github_error=expired.
    if (oauthErrorCode === "expired") {
      return (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <ConnectGithubPanel
            errorMessage={resolveGithubOAuthError("expired")}
          />
        </div>
      );
    }
    redirect(`${ROUTES.home}?github_error=expired`);
  }

  if (result.kind !== "ok") {
    return (
      <StateError>
        Could not load repositories. Try reconnecting GitHub.
      </StateError>
    );
  }

  const repos = result.data;

  return (
    <SuspenseStream
      fallback={
        <GithubReposBoard
          privateRepos={repos.privateRepos}
          publicRepos={repos.publicRepos}
          initialActivity={{}}
        />
      }
    >
      <GithubReposBoardWithSparklines repos={repos} />
    </SuspenseStream>
  );
}

async function GithubReposBoardWithSparklines({
  repos,
}: {
  repos: OwnGithubRepos;
}) {
  const visibleFullNames = [
    ...repos.privateRepos
      .slice(0, REPOS_PAGE_SIZE)
      .map((repo) => repo.fullName),
    ...repos.publicRepos.slice(0, REPOS_PAGE_SIZE).map((repo) => repo.fullName),
  ];

  const initialActivity: GithubCommitActivityMap =
    await getOwnGithubCommitActivity(visibleFullNames);

  return (
    <GithubReposBoard
      privateRepos={repos.privateRepos}
      publicRepos={repos.publicRepos}
      initialActivity={initialActivity}
    />
  );
}
