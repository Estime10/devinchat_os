import {
  githubHomescreenErrorMessage,
  loadGithubHomescreen,
} from "@/backend/features/02_github/services/load-github-homescreen/load-github-homescreen";
import { StateError } from "@/frontend/components/states/error/state-error";
import { ConnectGithubPanel } from "@/frontend/features/02_homescreen/github/ui/panel/connect-github-panel";
import { GithubReposBoard } from "@/frontend/features/02_homescreen/github/ui/repos/board/github-repos-board";
import { ROUTES } from "@/lib/routes";
import { redirect } from "next/navigation";

type GithubScreenProps = {
  oauthErrorCode?: string;
};

/**
 * Screen GitHub — un seul rendu board (pas de Suspense imbriqué / remount).
 * Sparklines page 1 via fetch client dans useGithubRepoColumn.
 */
export async function GithubScreen({ oauthErrorCode }: GithubScreenProps) {
  const data = await loadGithubHomescreen({ oauthErrorCode });
  const errorMessage = githubHomescreenErrorMessage(oauthErrorCode);

  if (data.kind === "disconnected") {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden py-10">
        <ConnectGithubPanel errorMessage={errorMessage} />
      </main>
    );
  }

  if (data.kind === "unauthorized") {
    if (data.alreadyExpired) {
      return (
        <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden py-10">
          <ConnectGithubPanel
            errorMessage={githubHomescreenErrorMessage("expired")}
          />
        </main>
      );
    }
    redirect(`${ROUTES.home}?github_error=expired`);
  }

  if (data.kind === "error") {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden py-5">
        <StateError>
          Could not load repositories. Try reconnecting GitHub.
        </StateError>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden py-5">
      <GithubReposBoard
        privateRepos={data.repos.privateRepos}
        publicRepos={data.repos.publicRepos}
      />
    </main>
  );
}
