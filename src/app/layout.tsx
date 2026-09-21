import type { Metadata } from "next";
import "./globals.css";
import "./editorial.css";
import "./motion.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { getAdSenseConfig } from "@/lib/adsense";

const { clientId: adSenseClientId } = getAdSenseConfig();

export const metadata: Metadata = {
  title: "MindBench — Cognitive training for curious minds",
  description:
    "Short cognitive drills, memory games, precision tests, and a little room for mystery.",
  icons: {
    icon: { url: "/brand/mindbench-wordmark-v2.png", type: "image/png" },
  },
  ...(adSenseClientId ? { other: { "google-adsense-account": adSenseClientId } } : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className="font-sans">
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main id="main-content" className="flex-1">{children}</main>
            <SiteFooter year={new Date().getFullYear()} />
          </div>
        </Providers>
      </body>
    </html>
  );
}
