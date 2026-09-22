import { StateError } from "@/frontend/components/states/error/state-error";
import { ConnectGithubActions } from "@/frontend/features/02_homescreen/github/ui/actions/connect-github-actions/connect-github-actions";
import { ConnectGithubHeader } from "@/frontend/features/02_homescreen/github/ui/header/connect-github-header";

type ConnectGithubPanelProps = {
  errorMessage?: string | null;
};

/**
 * Panneau disconnected — compose header + erreur + CTA.
 */
export function ConnectGithubPanel({ errorMessage }: ConnectGithubPanelProps) {
  return (
    <section
      aria-labelledby="connect-github-title"
      className="w-full max-w-lg rounded-tl-lg rounded-bl-lg border border-glass-border bg-glass-bg px-8 py-10 shadow-lg backdrop-blur-lg sm:px-10 sm:py-12"
    >
      <ConnectGithubHeader />

      {errorMessage ? (
        <StateError className="mt-6">{errorMessage}</StateError>
      ) : null}

      <div className="mt-8">
        <ConnectGithubActions />
      </div>
    </section>
  );
}
