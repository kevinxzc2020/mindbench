import type { MetadataRoute } from "next";
import { LANGS } from "@/lib/i18n";
import { absoluteUrl, languageAlternates } from "@/lib/site-url";
import { sitemapPaths } from "@/lib/site-routes";

/** One entry per language version of every public page, each listing all its alternates (and x-default). */
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapPaths().flatMap(path => {
    const languages = languageAlternates(path);
    return LANGS.map(lang => ({ url: absoluteUrl(lang, path), alternates: { languages } }));
  });
}
