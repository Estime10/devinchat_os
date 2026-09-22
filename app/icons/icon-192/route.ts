import { generateDevinchatIcon } from "@/lib/og/generate-devinchat-icon";

/** PWA icon 192×192. */
export function GET() {
  return generateDevinchatIcon({ width: 192, height: 192 });
}
