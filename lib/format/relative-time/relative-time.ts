/**
 * Format compact relatif (en) — ex. "2d ago", "3mo ago".
 */
export function formatRelativeTime(isoDate: string, now = new Date()): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);

  if (absSec < 60) {
    return "just now";
  }

  const minutes = Math.round(absSec / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  if (days < 45) {
    return `${days}d ago`;
  }

  const months = Math.round(days / 30);
  if (months < 18) {
    return `${months}mo ago`;
  }

  const years = Math.round(days / 365);
  return `${years}y ago`;
}
