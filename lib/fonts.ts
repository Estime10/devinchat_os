import localFont from "next/font/local";

/**
 * Mona Sans — typographie brand GitHub (open source).
 * Centralisé ici ; ne pas importer de fonts dans les composants UI.
 */
export const monaSans = localFont({
  src: "../public/fonts/MonaSans-Variable.woff2",
  variable: "--font-mona-sans",
  display: "swap",
  weight: "200 900",
});
