type StateLoadingProps = {
  children?: React.ReactNode;
  className?: string;
};

/**
 * État loading réutilisable — feedback async non-bloquant.
 */
export function StateLoading({
  children = "[ loading... ]",
  className = "",
}: StateLoadingProps) {
  return (
    <p
      className={`font-sans text-sm text-white/50 uppercase ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      {children}
    </p>
  );
}
