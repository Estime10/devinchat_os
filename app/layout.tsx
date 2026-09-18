import type { Metadata } from "next";
import { monaSans } from "@/lib/fonts/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevinChat OS",
  description: "Developer Progress OS — miroir d’activité de développement",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${monaSans.variable} h-full bg-background text-foreground antialiased`}
    >
      <body className="flex min-h-full flex-col bg-transparent font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
