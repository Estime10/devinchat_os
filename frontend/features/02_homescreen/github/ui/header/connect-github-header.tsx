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
        Mirror repo activity into feature progress. You authenticate on GitHub —
        password and 2FA stay there. We only receive scoped access tokens
        server-side.
      </p>
    </header>
  );
}
