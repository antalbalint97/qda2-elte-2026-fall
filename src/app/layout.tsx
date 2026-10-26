import type { Metadata, Viewport } from "next";
import { Fira_Code, Source_Serif_4 } from "next/font/google";
import localFont from "next/font/local";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

// Design system V3: Instrument Sans for the interface, Source Serif 4 for mathematics, Fira Code for numerals
// Instrument Sans (SIL OFL 1.1, public/fonts/InstrumentSans-OFL.txt) is self-hosted as a latin/latin-ext subset
// without the combining diacritics (U+0300–036F): its combining macron has no anchor and drew x̄ beside the x.
// Clusters such as x̄ now fall back to Source Serif 4, which places the bar correctly.
const sans = localFont({ src: "./fonts/InstrumentSans-QDA2.woff2", variable: "--font-instrument", weight: "400 700", display: "swap" });
const serif = Source_Serif_4({ variable: "--font-serif4", subsets: ["latin", "latin-ext"] });
const mono = Fira_Code({ variable: "--font-fira", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: "QDA2 Interactive Lab", template: "%s · QDA2 Interactive Lab" },
  description:
    "An interactive companion for Quantitative Data Analysis 2: measurement levels, crosstabs, the Lazarsfeld paradigm, p-values, correlation and t-tests.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1320" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${sans.variable} ${serif.variable} ${mono.variable} font-sans antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
