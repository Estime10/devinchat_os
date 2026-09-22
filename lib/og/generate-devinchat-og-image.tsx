import { ImageResponse } from "next/og";
import { BRAND, SITE_TAGLINE } from "@/lib/brand/brand";

export const OG_IMAGE_ALT = `DevinChat OS — ${SITE_TAGLINE}`;
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const OG_IMAGE_CONTENT_TYPE = "image/png";

/**
 * Image OG / Twitter — canvas phosphore (tokens BRAND).
 */
export function generateDevinchatOgImage(): ImageResponse {
  const scan = `rgba(${BRAND.phosphorRgb},0.05)`;
  const bloom = `rgba(${BRAND.phosphorRgb},0.16)`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: BRAND.canvasSubtle,
        color: BRAND.fgDefault,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
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
          backgroundImage: `linear-gradient(${scan} 1px, transparent 1px)`,
          backgroundSize: "100% 28px",
          opacity: 0.35,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          background: `radial-gradient(ellipse 70% 55% at 50% 40%, ${bloom} 0%, transparent 62%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          position: "relative",
          fontSize: 22,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: BRAND.fgMuted,
        }}
      >
        {"// progress os"}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.02,
            color: BRAND.fgDefault,
          }}
        >
          DevinChat OS
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: 820,
            fontSize: 32,
            lineHeight: 1.35,
            color: BRAND.fgMuted,
          }}
        >
          {SITE_TAGLINE}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          width: "100%",
          position: "relative",
          fontSize: 20,
          letterSpacing: "0.06em",
          color: BRAND.fgSubtle,
        }}
      >
        <span style={{ display: "flex" }}>github → features → notes</span>
        <span style={{ display: "flex" }}>ready.</span>
      </div>
    </div>,
    { ...OG_IMAGE_SIZE },
  );
}
