/**
 * Magic bytes WebP : RIFF....WEBP (offset 0 / 8).
 * Ne pas se fier au seul Content-Type client.
 */
export function isWebpBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 12) {
    return false;
  }
  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}
