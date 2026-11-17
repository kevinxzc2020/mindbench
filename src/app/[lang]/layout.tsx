import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import "../editorial.css";
import "../motion.css";
import "../laboratory.css";
import "../activity-lab.css";
import { SiteSurface } from "@/components/SiteSurface";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { getAdSenseConfig } from "@/lib/adsense";
import { LANGS, LANG_META, isLang } from "@/lib/i18n";
import { LANG_REDIRECT_SCRIPT } from "@/lib/lang-redirect";
import { siteMetadata } from "@/lib/seo";

const { clientId: adSenseClientId } = getAdSenseConfig();
const SKIP_LINK = { en: "Skip to content", zh: "跳到主要内容", es: "Saltar al contenido" };

/** One statically generated copy of every page per language: /en (served at /), /zh and /es. */
export function generateStaticParams() {
  return LANGS.map(lang => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  if (!isLang(params.lang)) return {};
  return {
    ...siteMetadata(params.lang),
    icons: {
      icon: { url: "/brand/mindbench-laboratory-favicon.png", type: "image/png", sizes: "64x64" },
      apple: { url: "/brand/mindbench-laboratory-apple.png", type: "image/png", sizes: "180x180" },
    },
    ...(adSenseClientId ? { other: { "google-adsense-account": adSenseClientId } } : {}),
  };
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  if (!isLang(params.lang)) notFound();
  const lang = params.lang;
  return (
    <html
      lang={LANG_META[lang].htmlLang}
      suppressHydrationWarning
    >
      {/* English URLs only: a first-time visitor whose browser prefers zh/es is moved to that URL. Never for crawlers. */}
      {lang === "en" && <head><script dangerouslySetInnerHTML={{ __html: LANG_REDIRECT_SCRIPT }} /></head>}
      <body className="font-sans">
        <a className="skip-link" href="#main-content">{SKIP_LINK[lang]}</a>
        <Providers lang={lang}>
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
