import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Touchline — Live football scores, stats & tables",
    template: "%s · Touchline",
  },
  description:
    "Fast live football scores, fixtures, league tables, match stats, lineups and player data from every major competition.",
  applicationName: "Touchline",
  keywords: [
    "football scores",
    "live scores",
    "football stats",
    "league tables",
    "fixtures",
    "lineups",
    "Premier League",
    "Champions League",
  ],
  openGraph: {
    title: "Touchline — Live football scores, stats & tables",
    description:
      "Every match, every league, every number. Live scores, tables, lineups and deep stats.",
    type: "website",
    siteName: "Touchline",
  },
  twitter: {
    card: "summary_large_image",
    title: "Touchline — Live football scores, stats & tables",
    description:
      "Every match, every league, every number. Live scores, tables, lineups and deep stats.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#100e0c" },
    { media: "(prefers-color-scheme: light)", color: "#e7e2d7" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-accent="ember"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('touchline-theme')==='dark'?'dark':'light';var a=localStorage.getItem('touchline-accent');var ok={ember:1,pitch:1,gold:1,ocean:1};if(!a||!ok[a])a='ember';document.documentElement.dataset.theme=t;document.documentElement.dataset.accent=a;document.documentElement.style.colorScheme=t;}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-on-accent"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh flex-col">
          <Suspense fallback={<div className="h-[57px] border-b border-line bg-base/80" />}>
            <SiteHeader />
          </Suspense>
          <main id="main" className="flex-1 pb-24 md:pb-0">
            {children}
          </main>
          <SiteFooter />
        </div>
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
      </body>
    </html>
  );
}
