import { generateDevinchatIcon } from "@/lib/og/generate-devinchat-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return generateDevinchatIcon(size);
}
