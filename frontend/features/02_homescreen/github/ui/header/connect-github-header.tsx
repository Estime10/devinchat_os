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
        See your repos as a living branch tree and keep notes on each feature.
        We only read from GitHub; nothing is written back. Private repos need
        the usual GitHub <code className="text-xs">repo</code> access.
      </p>
    </header>
  );
}
