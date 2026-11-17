import type { Lang } from "./translations";

/**
 * Language-prefixed URLs. English keeps the original, un-prefixed URLs (`/tools/keyboard`);
 * Chinese and Spanish live under `/zh/...` and `/es/...`. Internally every page is rendered by
 * the `[lang]` route segment, and `next.config.mjs` rewrites un-prefixed URLs to `/en/...`.
 *
 * This module is pure (no React, no Next) so server code, client code and tests can share it.
 */
export type { Lang };

export const LANGS = ["en", "zh", "es"] as const satisfies readonly Lang[];
export const DEFAULT_LANG: Lang = "en";
/** localStorage key that remembers the language the visitor picked in the switcher. */
export const LANG_STORAGE_KEY = "mb-lang";

export interface LangMeta {
  /** Value of `<html lang>`. */
  htmlLang: string;
  /** Value used in `hreflang` alternates (language, plus region where it matters). */
  hreflang: string;
  /** Open Graph locale. */
  ogLocale: string;
  /** Short label for the switcher. */
  label: string;
  /** The language's own name. */
  name: string;
}

export const LANG_META: Record<Lang, LangMeta> = {
  en: { htmlLang: "en", hreflang: "en", ogLocale: "en_US", label: "EN", name: "English" },
  zh: { htmlLang: "zh-CN", hreflang: "zh-CN", ogLocale: "zh_CN", label: "中", name: "中文" },
  es: { htmlLang: "es", hreflang: "es", ogLocale: "es_ES", label: "ES", name: "Español" },
};

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/** A leading `/en`, `/zh` or `/es` segment — never `/english` or `/zhang`. */
const LANG_PREFIX = /^\/(en|zh|es)(?=[/?#]|$)/;

/** The language a URL variant belongs to; un-prefixed URLs are the default language. */
export function langOfPath(pathname: string): Lang {
  const match = LANG_PREFIX.exec(pathname);
  return match ? (match[1] as Lang) : DEFAULT_LANG;
}

/**
 * The path with its language prefix removed (`/zh/tools/mouse` → `/tools/mouse`, `/es` → `/`).
 * Everything that matches on routes (ads, active navigation, analytics) should use this, because
 * a statically generated English page sees `/en/...` on the server and `/...` in the browser.
 */
export function stripLangPrefix(path: string): string {
  const rest = path.replace(LANG_PREFIX, "");
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/** Files and framework routes that exist once, outside the language variants. */
const NON_PAGE_PATH = /^\/(?:api|_next)(?:\/|$)/;
const STATIC_FILE = /\.(?:avif|bmp|css|csv|fbx|gif|glb|gltf|html?|ico|jpe?g|js|json|map|mjs|mp3|mp4|ogg|pdf|png|svg|txt|wasm|wav|webm|webp|woff2?|xml|zip)$/i;

/** True when the path is a page that has language variants (not an API route or a public file). */
export function isPagePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !NON_PAGE_PATH.test(path) && !STATIC_FILE.test(path);
}

/**
 * Put an internal href into `lang`, replacing any prefix it already has and keeping `?query` and
 * `#hash`. External URLs, `#hash` links, `mailto:`, API routes and files are returned untouched.
 * The same function switches a page between languages: `localizePath("zh", "/es/tools/mouse")`.
 */
export function localizePath(lang: Lang, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const tail = cut === -1 ? "" : href.slice(cut);
  if (!isPagePath(path)) return href;
  const bare = stripLangPrefix(path);
  const prefixed = lang === DEFAULT_LANG ? bare : bare === "/" ? `/${lang}` : `/${lang}${bare}`;
  return prefixed + tail;
}

export function matchLang(tag: string | null | undefined): Lang | null {
  const primary = String(tag ?? "").toLowerCase().split(/[-_]/)[0];
  return isLang(primary) ? primary : null;
}

/** The language a first-time visitor should land in: their saved choice, else the first supported browser language. */
export function preferredLang(stored: string | null | undefined, browserLanguages: readonly string[]): Lang {
  if (isLang(stored)) return stored;
  for (const tag of browserLanguages) {
    const match = matchLang(tag);
    if (match) return match;
  }
  return DEFAULT_LANG;
}

/** Remember the visitor's explicit choice. Storage may be blocked, in which case the choice lasts for the visit only. */
export function rememberLang(lang: Lang) {
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch { /* storage blocked */ }
}
