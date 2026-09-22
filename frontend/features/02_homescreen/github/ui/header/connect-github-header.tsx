/**
 * Header panneau Connect GitHub (disconnected).
 */
export function ConnectGithubHeader() {
  return (
    <header className="space-y-2">
      <p className="font-sans text-xs tracking-[0.2em] text-white uppercase">
        {"// github"}
      </p>
      <p className="font-sans text-xs text-white uppercase">
        status: <span className="text-danger-fg">disconnected</span>
      </p>
      <h1
        id="connect-github-title"
        className="font-sans text-2xl font-semibold tracking-tight text-fg-default sm:text-3xl"
      >
        Connect GitHub
      </h1>
      <p className="font-sans text-sm text-white">
        Mirror repo activity into a branch pyramid. Auth stays on GitHub. We
        only call read APIs (GET) — though classic OAuth still requires the
        broad <code className="text-xs">repo</code> scope to see private repos.
      </p>
    </header>
  );
}
