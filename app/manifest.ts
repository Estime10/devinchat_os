import type { MetadataRoute } from "next";
import { BRAND, SITE_TAGLINE } from "@/lib/brand/brand";

/**
 * Web App Manifest — installabilité (standalone).
 * Icons 192/512 générés via /icons/icon-*.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "DevinChat OS",
    short_name: "DevinChat",
    description: SITE_TAGLINE,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: BRAND.canvasSubtle,
    theme_color: BRAND.canvasSubtle,
    categories: ["productivity", "developer"],
    icons: [
      {
        src: "/icons/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
