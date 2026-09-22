type StateErrorProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * État erreur réutilisable — message danger + role alert.
 */
export function StateError({ children, className = "" }: StateErrorProps) {
  return (
    <p
      className={`font-sans text-sm text-danger-fg ${className}`.trim()}
      role="alert"
    >
      {children}
    </p>
  );
}
