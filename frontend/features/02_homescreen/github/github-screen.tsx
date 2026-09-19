import { resolveGithubOAuthError } from "@/backend/features/02_github/messages/resolve-github-oauth-error";
import { getOwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection";
import { listOwnGithubRepos } from "@/backend/features/02_github/services/list-own-github-repos";
import { StateError } from "@/frontend/components/states/error/state-error";
import { ConnectGithubPanel } from "@/frontend/features/02_homescreen/github/ui/panel/connect-github-panel";
import { GithubReposBoard } from "@/frontend/features/02_homescreen/github/ui/repos/board/github-repos-board";

type GithubScreenProps = {
  oauthErrorCode?: string;
};

/**
 * Orchestrateur feature GitHub — badge vit dans le Header.
 * Homescreen : viewport fixe, spacing aéré.
 */
export async function GithubScreen({ oauthErrorCode }: GithubScreenProps) {
  const connection = await getOwnGithubConnection();
  const errorMessage = resolveGithubOAuthError(oauthErrorCode);

  if (!connection) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden py-10">
        <ConnectGithubPanel errorMessage={errorMessage} />
      </main>
    );
  }

  const repos = await listOwnGithubRepos();

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden py-5">
      {repos ? (
        <GithubReposBoard
          privateRepos={repos.privateRepos}
          publicRepos={repos.publicRepos}
        />
      ) : (
        <StateError>
          Could not load repositories. Try reconnecting GitHub.
        </StateError>
      )}
    </main>
  );
}
