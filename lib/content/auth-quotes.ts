export const AUTH_QUOTES = [
  "You don’t need to remember where you were. Your work already knows.",
  "Turn development activity into visible progress.",
  "Your code moves forward. Your projects should show it.",
  "Know what changed. Know what’s next.",
  "From commits to clarity.",
] as const;

export type AuthQuote = (typeof AUTH_QUOTES)[number];

export function pickRandomAuthQuote(exclude?: string): AuthQuote {
  const pool =
    exclude === undefined
      ? AUTH_QUOTES
      : AUTH_QUOTES.filter((quote) => quote !== exclude);

  const candidates = pool.length > 0 ? pool : AUTH_QUOTES;
  const index = Math.floor(Math.random() * candidates.length);

  return candidates[index]!;
}
