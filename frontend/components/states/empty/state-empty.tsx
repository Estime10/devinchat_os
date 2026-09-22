type StateEmptyProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * État vide réutilisable — liste / section sans données.
 */
export function StateEmpty({ children, className = "" }: StateEmptyProps) {
  return (
    <p className={`font-sans text-sm text-white/50 ${className}`.trim()}>
      {children}
    </p>
  );
}
