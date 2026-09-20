type GlassPanelProps = {
  children?: React.ReactNode;
  className?: string;
};

/**
 * Surface glassmorphism — styles dans lib/styles/ui/glass-panel.css.
 */
export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return <div className={`glass-panel ${className}`.trim()}>{children}</div>;
}
