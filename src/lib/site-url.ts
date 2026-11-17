import { LANGS, LANG_META, localizePath, type Lang } from "./i18n";

const FALLBACK_ORIGIN = "http://localhost:3000";

function normalizeOrigin(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Public origin used for canonical URLs, hreflang alternates and the sitemap.
 * `NEXT_PUBLIC_SITE_URL` wins; otherwise the hosting platform's own variable is used
 * (Netlify `URL`, Vercel production URL), and local development falls back to localhost.
 */
export function getSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const configured = normalizeOrigin(env.NEXT_PUBLIC_SITE_URL)
    ?? normalizeOrigin(env.URL)
    ?? normalizeOrigin(env.VERCEL_PROJECT_PRODUCTION_URL);
  if (configured) return configured;
  if (env.NODE_ENV === "production" && !warned) {
    warned = true;
    console.warn(`[seo] NEXT_PUBLIC_SITE_URL is not set: canonical URLs, hreflang links and the sitemap use ${FALLBACK_ORIGIN}.`);
  }
  return FALLBACK_ORIGIN;
}
let warned = false;

/** Absolute URL of `path` in `lang`, e.g. `absoluteUrl("zh", "/tools/keyboard")` → `https://…/zh/tools/keyboard`. */
export function absoluteUrl(lang: Lang, path: string, origin: string = getSiteUrl()) {
  return `${origin}${localizePath(lang, path)}`;
}

/** `hreflang` → URL for every language version of `path`, plus `x-default` (the default language). */
export function languageAlternates(path: string, origin: string = getSiteUrl()): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const lang of LANGS) alternates[LANG_META[lang].hreflang] = absoluteUrl(lang, path, origin);
  alternates["x-default"] = absoluteUrl("en", path, origin);
  return alternates;
}
