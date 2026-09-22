import { Button } from "@/frontend/components/ui/button/button";
import { ROUTES } from "@/lib/routes";

type ReconnectGithubActionsProps = {
  canReconnect: boolean;
  /** link = même style que [ logout ] dans le header */
  variant?: "button" | "link";
};

const linkClassName =
  "cursor-pointer font-sans text-sm tracking-tight text-fg-muted uppercase transition-colors hover:text-fg-default disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-fg-muted";

/**
 * CTA reconnect — disabled tant que la connexion est healthy.
 */
export function ReconnectGithubActions({
  canReconnect,
  variant = "button",
}: ReconnectGithubActionsProps) {
  return (
    <form action={ROUTES.api.github.connect} method="get">
      {variant === "link" ? (
        <button
          type="submit"
          disabled={!canReconnect}
          className={linkClassName}
        >
          [ reconnect ]
        </button>
      ) : (
        <Button
          type="submit"
          disabled={!canReconnect}
          className="px-3 py-1.5 text-xs"
        >
          [ reconnect ]
        </Button>
      )}
    </form>
  );
}
