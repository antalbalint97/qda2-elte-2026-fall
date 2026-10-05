import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const serif = Source_Serif_4({ variable: "--font-serif4", subsets: ["latin", "latin-ext"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "QDA2 Interactive Lab", template: "%s · QDA2 Interactive Lab" },
  description:
    "An interactive companion for Quantitative Data Analysis 2: measurement levels, crosstabs, the Lazarsfeld paradigm, p-values, correlation and t-tests.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${serif.variable} ${mono.variable} font-sans antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <footer className="border-t border-line py-8 text-center text-xs text-faint">
          QDA2 Interactive Lab · a study companion for Quantitative Data Analysis 2 · progress is stored only in this
          browser
        </footer>
      </body>
    </html>
  );
}
