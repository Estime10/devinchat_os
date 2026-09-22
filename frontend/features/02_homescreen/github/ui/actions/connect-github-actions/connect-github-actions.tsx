import { ROUTES } from "@/lib/routes";

const connectClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-none border border-fg-default bg-fg-default/15 px-5 py-2.5 font-sans text-sm font-semibold tracking-wide text-fg-default uppercase transition-colors hover:bg-fg-default/25";

/**
 * CTA OAuth — lien hard vers /api/github/connect (évite soft-nav / form GET flaky).
 */
export function ConnectGithubActions() {
  return (
    <a href={ROUTES.api.github.connect} className={connectClassName}>
      [ connect github ]
    </a>
  );
}
