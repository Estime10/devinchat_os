type SkeletonLineProps = {
  className?: string;
};

/**
 * Ligne skeleton — primitive layout.
 */
export function SkeletonLine({ className = "" }: SkeletonLineProps) {
  return (
    <div
      className={`rounded-sm bg-white/10 ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
