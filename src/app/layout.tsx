import type { Metadata, Viewport } from "next";
import { Doto, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { MobileBar } from "@/components/top-nav";
import { Rail } from "@/components/rail";
import { SiteHeader } from "@/components/site-header";
import { ScanBar } from "@/components/tl";
import { SfxController } from "@/components/sfx";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-face-mono",
  subsets: ["latin"],
  display: "swap",
});

const doto = Doto({
  variable: "--font-face-doto",
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
    { media: "(prefers-color-scheme: light)", color: "#e3ded8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f0d" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${doto.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('touchline-theme')==='dark'?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){}try{if(localStorage.getItem('touchline-rail')==='1')document.documentElement.dataset.rail='compact';}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:bg-ink focus:px-4 focus:py-2 focus:text-[11px] focus:font-semibold focus:uppercase focus:tracking-[0.08em] focus:text-accent"
        >
          Skip to content
        </a>
        <Suspense fallback={<div className="hidden h-dvh w-[272px] lg:block" />}>
          <Rail />
        </Suspense>
        <div className="tl-stage flex min-h-dvh flex-col">
          <Suspense fallback={<div className="h-[57px] border-b border-line bg-base/80" />}>
            <SiteHeader />
          </Suspense>
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
        <Suspense fallback={null}>
          <MobileBar />
        </Suspense>
        <SfxController />
        <ScanBar />
      </body>
    </html>
  );
}
