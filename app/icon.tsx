import { generateDevinchatIcon } from "@/lib/og/generate-devinchat-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return generateDevinchatIcon(size);
}
