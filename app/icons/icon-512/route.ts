import { generateDevinchatIcon } from "@/lib/og/generate-devinchat-icon";

/** PWA icon 512×512 (any + maskable). */
export function GET() {
  return generateDevinchatIcon({ width: 512, height: 512 });
}
