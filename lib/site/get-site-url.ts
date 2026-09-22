/**
 * URL absolue du site — OG / metadataBase.
 * Prod : NEXT_PUBLIC_APP_URL ou VERCEL_URL. Local : localhost:3000.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) {
    return new URL(explicit);
  }

  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    return new URL(`https://${vercel}`);
  }

  return new URL("http://localhost:3000");
}
