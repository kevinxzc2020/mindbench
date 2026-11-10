import type { Metadata } from "next";
import "./globals.css";
import "./editorial.css";
import "./motion.css";
import "./laboratory.css";
import "./activity-lab.css";
import { SiteSurface } from "@/components/SiteSurface";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { getAdSenseConfig } from "@/lib/adsense";

const { clientId: adSenseClientId } = getAdSenseConfig();

export const metadata: Metadata = {
  title: "MindBench — Tests, tools & curious minds",
  description:
    "Explore cognitive tests, personality activities, games and official device resources. Check your keyboard, mouse, screen, speakers and microphone in the device collection.",
  icons: {
    icon: { url: "/brand/mindbench-laboratory-favicon.png", type: "image/png", sizes: "64x64" },
    apple: { url: "/brand/mindbench-laboratory-apple.png", type: "image/png", sizes: "180x180" },
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
            <main id="main-content" className="flex-1"><SiteSurface>{children}</SiteSurface></main>
            <SiteFooter year={new Date().getFullYear()} />
          </div>
        </Providers>
      </body>
    </html>
  );
}
