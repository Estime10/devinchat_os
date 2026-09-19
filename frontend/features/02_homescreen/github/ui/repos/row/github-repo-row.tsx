type GithubRepoRowProps = {
  fullName: string;
  htmlUrl: string;
  description: string | null;
};

/**
 * Ligne repo — présentation pure.
 */
export function GithubRepoRow({
  fullName,
  htmlUrl,
  description,
}: GithubRepoRowProps) {
  return (
    <a
      href={htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-none px-2 py-2.5 transition-colors hover:bg-fg-default/10"
    >
      <p className="truncate font-sans text-sm text-white">{fullName}</p>
      {description ? (
        <p className="mt-0.5 line-clamp-2 font-sans text-xs text-white/50">
          {description}
        </p>
      ) : null}
    </a>
  );
}
