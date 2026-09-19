import { canReconnectGithub } from "@/backend/features/02_github/domain/can-reconnect-github";
import { resolveGithubOAuthError } from "@/backend/features/02_github/messages/resolve-github-oauth-error";
import { getOwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection";
import { listOwnGithubRepos } from "@/backend/features/02_github/services/list-own-github-repos";
import { StateError } from "@/frontend/components/states/error/state-error";
import { GithubConnectionBadge } from "@/frontend/features/02_homescreen/github/ui/badge/github-connection-badge";
import { ConnectGithubPanel } from "@/frontend/features/02_homescreen/github/ui/panel/connect-github-panel";
import { GithubReposBoard } from "@/frontend/features/02_homescreen/github/ui/repos/board/github-repos-board";

type GithubScreenProps = {
  oauthErrorCode?: string;
};

/**
 * Orchestrateur feature GitHub — fetch + compose UI.
 * Pas de logique métier dans les composants UI enfants.
 */
export async function GithubScreen({ oauthErrorCode }: GithubScreenProps) {
  const connection = await getOwnGithubConnection();
  const errorMessage = resolveGithubOAuthError(oauthErrorCode);

  if (!connection) {
    return (
      <main className="flex flex-1 items-center justify-center py-12 sm:py-16">
        <ConnectGithubPanel errorMessage={errorMessage} />
      </main>
    );
  }

  const repos = await listOwnGithubRepos();
  const canReconnect = canReconnectGithub(connection.status, {
    force: !repos,
  });

  return (
    <main className="flex flex-1 flex-col gap-8 py-8 sm:py-10">
      <div className="flex items-start justify-between gap-4">
        <GithubConnectionBadge
          login={connection.githubLogin}
          status={connection.status}
          canReconnect={canReconnect}
        />
      </div>

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
