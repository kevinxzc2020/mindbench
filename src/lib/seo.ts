import type { Metadata } from "next";
import { LANGS, LANG_META, isLang, type Lang } from "./i18n";
import { absoluteUrl, getSiteUrl, languageAlternates } from "./site-url";
import { routeInfo, SITE_NAME } from "./site-routes";
import { translations } from "./translations";

function openGraph(lang: Lang, url: string, title: string, description: string): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: SITE_NAME,
    url,
    title,
    description,
    locale: LANG_META[lang].ogLocale,
    alternateLocale: LANGS.filter(other => other !== lang).map(other => LANG_META[other].ogLocale),
  };
}

/** Site-wide defaults for one language; every page that has its own copy overrides them. */
export function siteMetadata(lang: Lang): Metadata {
  const { siteTitle, siteDesc } = translations[lang];
  return {
    metadataBase: new URL(getSiteUrl()),
    title: siteTitle,
    description: siteDesc,
    openGraph: openGraph(lang, absoluteUrl(lang, "/"), siteTitle, siteDesc),
  };
}

/**
 * Translated title and description, a canonical URL and `hreflang` alternates (with `x-default`)
 * for a registered page. Draft pages get `noindex` instead of alternates. Each page states its own
 * canonical URL: it is never inherited from the layout, where it would point every page at the home page.
 */
export function pageMetadata(lang: Lang, path: string): Metadata {
  const info = routeInfo(path);
  if (!info) return {};
  const { title, description } = info.copy[lang];
  const url = absoluteUrl(lang, path);
  return {
    title,
    description,
    ...(info.noindex
      ? { robots: { index: false, follow: true } }
      : { alternates: { canonical: url, languages: languageAlternates(path) } }),
    openGraph: openGraph(lang, url, title, description),
  };
}

/** `generateMetadata` for a page or layout with a fixed path. */
export function routeMetadata(path: string) {
  return ({ params }: { params: { lang: string } }): Metadata => (isLang(params.lang) ? pageMetadata(params.lang, path) : {});
}
