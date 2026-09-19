import { ReconnectGithubActions } from "@/frontend/features/02_homescreen/github/ui/actions/reconnect-github-actions";

type GithubConnectionBadgeProps = {
  login: string;
  status: string;
  canReconnect: boolean;
};

/**
 * Badge compact connexion GitHub — présentation pure.
 */
export function GithubConnectionBadge({
  login,
  status,
  canReconnect,
}: GithubConnectionBadgeProps) {
  const statusColor = canReconnect ? "text-danger-fg" : "text-fg-default";

  return (
    <div className="inline-flex max-w-full flex-wrap items-center gap-3 rounded-tl-lg rounded-bl-lg border border-glass-border bg-glass-bg px-4 py-2.5 backdrop-blur-lg">
      <div className="min-w-0 space-y-0.5">
        <p className="font-sans text-[10px] tracking-[0.2em] text-white uppercase">
          {"// github"}
        </p>
        <p className="truncate font-sans text-sm text-white">
          <span className="text-fg-default uppercase">@{login}</span>
          <span className="text-white/50"> · </span>
          <span className={`${statusColor} uppercase`}>{status}</span>
        </p>
      </div>

      <ReconnectGithubActions canReconnect={canReconnect} />
    </div>
  );
}
