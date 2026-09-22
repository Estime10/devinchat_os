import { Button } from "@/frontend/components/ui/button/button";
import { ROUTES } from "@/lib/routes";

/**
 * CTA OAuth — démarre /api/github/connect.
 */
export function ConnectGithubActions() {
  return (
    <form action={ROUTES.api.github.connect} method="get">
      <Button type="submit">[ connect github ]</Button>
    </form>
  );
}
