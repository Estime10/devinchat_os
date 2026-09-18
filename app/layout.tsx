import type { Metadata } from "next";
import { monaSans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevinChat OS",
  description: "Developer Progress OS — miroir d’activité de développement",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${monaSans.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col">{children}</body>
    </html>
  );
}
