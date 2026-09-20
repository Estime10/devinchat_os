/**
 * Portfolio / repository — plein écran, sans Header app.
 */
export default function RepositoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-[var(--layout-margin-x)] pb-4">
      {children}
    </div>
  );
}
