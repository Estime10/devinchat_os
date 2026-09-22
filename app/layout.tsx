import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "@/lib/pwa/register-service-worker";
import { BRAND, SITE_TAGLINE } from "@/lib/brand/brand";
import { monaSans } from "@/lib/fonts/fonts";
import { getSiteUrl } from "@/lib/site/get-site-url";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: BRAND.canvasSubtle,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "DevinChat OS",
    template: "%s · DevinChat OS",
  },
  description: SITE_TAGLINE,
  applicationName: "DevinChat OS",
  appleWebApp: {
    capable: true,
    title: "DevinChat OS",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "DevinChat OS",
    title: "DevinChat OS",
    description: SITE_TAGLINE,
  },
  twitter: {
    card: "summary_large_image",
    title: "DevinChat OS",
    description: SITE_TAGLINE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${monaSans.variable} h-full bg-background text-foreground antialiased`}
    >
      <body className="flex min-h-full flex-col bg-transparent font-sans text-foreground">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
