import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand/brand";

type DevinchatIconSize = {
  width: number;
  height: number;
};

/**
 * Favicon / apple-icon — monogramme D (tokens BRAND).
 */
export function generateDevinchatIcon(size: DevinchatIconSize): ImageResponse {
  const { width } = size;
  const fontSize = Math.round(width * 0.58);
  const glow = Math.max(4, Math.round(width * 0.08));
  const bloom = `rgba(${BRAND.phosphorRgb},0.22)`;
  const glowColor = `rgba(${BRAND.phosphorRgb},0.65)`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND.canvasSubtle,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          background: `radial-gradient(circle at 50% 45%, ${bloom} 0%, transparent 62%)`,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "relative",
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          color: BRAND.fgDefault,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textShadow: `0 0 ${glow}px ${glowColor}`,
          lineHeight: 1,
        }}
      >
        D
      </div>
    </div>,
    { ...size },
  );
}
