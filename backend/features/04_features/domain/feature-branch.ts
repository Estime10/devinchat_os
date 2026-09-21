/**
 * Nom d’affichage depuis n’importe quelle branche Git.
 * `feature/authentication-ui` → `Authentication UI`
 * `main` → `Main`
 */
export function featureNameFromBranch(branchName: string): string {
  const slug = branchName.startsWith("feature/")
    ? branchName.slice("feature/".length)
    : branchName;

  return slug
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((part) => {
      if (part.length <= 2) {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}
