type GlassPanelProps = {
  children?: React.ReactNode;
  className?: string;
};

/**
 * Surface glassmorphism.
 * Hauteur = viewport − 2× --header-height (espace haut + bas, sans header réel).
 * Marge horizontale gérée par le screen parent.
 */
export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div
      className={`my-[var(--header-height)] h-[calc(100dvh-2*var(--header-height))] w-full rounded-tl-lg rounded-bl-lg border border-glass-border shadow-glass-shadow backdrop-blur-lg ${className}`.trim()}
    >
      {children}
    </div>
  );
}
