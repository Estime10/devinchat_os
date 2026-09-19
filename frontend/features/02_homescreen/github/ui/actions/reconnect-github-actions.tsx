import { Button } from "@/frontend/components/ui/button/button";
import { ROUTES } from "@/lib/routes";

type ReconnectGithubActionsProps = {
  canReconnect: boolean;
};

/**
 * CTA reconnect — disabled tant que la connexion est healthy.
 */
export function ReconnectGithubActions({
  canReconnect,
}: ReconnectGithubActionsProps) {
  return (
    <form action={ROUTES.api.github.connect} method="get">
      <Button
        type="submit"
        disabled={!canReconnect}
        className="px-3 py-1.5 text-xs"
      >
        [ reconnect ]
      </Button>
    </form>
  );
}
