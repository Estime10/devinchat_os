import { Button } from "@/frontend/components/ui/button/button";
import { ROUTES } from "@/lib/routes";

type ReconnectGithubActionsProps = {
  canReconnect: boolean;
  /** link = même style que [ logout ] dans le header */
  variant?: "button" | "link";
};

const linkClassName =
  "cursor-pointer font-sans text-sm tracking-tight text-fg-muted uppercase transition-colors hover:text-fg-default aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40";

/**
 * CTA reconnect — disabled tant que la connexion est healthy.
 * Lien hard (pas de form GET) pour forcer une navigation document complète.
 */
export function ReconnectGithubActions({
  canReconnect,
  variant = "button",
}: ReconnectGithubActionsProps) {
  if (!canReconnect) {
    if (variant === "link") {
      return (
        <span className={linkClassName} aria-disabled="true">
          [ reconnect ]
        </span>
      );
    }
    return (
      <Button type="button" disabled className="px-3 py-1.5 text-xs">
        [ reconnect ]
      </Button>
    );
  }

  if (variant === "link") {
    return (
      <a href={ROUTES.api.github.connect} className={linkClassName}>
        [ reconnect ]
      </a>
    );
  }

  return (
    <a
      href={ROUTES.api.github.connect}
      className="inline-flex cursor-pointer items-center justify-center rounded-none border border-fg-default bg-fg-default/15 px-3 py-1.5 font-sans text-xs font-semibold tracking-wide text-fg-default uppercase transition-colors hover:bg-fg-default/25"
    >
      [ reconnect ]
    </a>
  );
}
