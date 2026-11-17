# Multilingual URLs and SEO

Updated 2026-11-17.

MindBench is published in English, Chinese and Spanish. Each language has its own URL, so search engines can
index every version and visitors can share a link in their own language.

| Language | URL | `<html lang>` | `hreflang` |
|---|---|---|---|
| English (default) | `/tools/keyboard` | `en` | `en`, `x-default` |
| Chinese | `/zh/tools/keyboard` | `zh-CN` | `zh-CN` |
| Spanish | `/es/tools/keyboard` | `es` | `es` |

English keeps the original, un-prefixed URLs. `/en/...` only exists internally and redirects (308) to the plain URL.

## How it works

- **One route tree.** Every page lives in `src/app/[lang]/`. `[lang]/layout.tsx` is the root layout: it sets
  `<html lang>`, the language-specific default metadata and the providers. `generateStaticParams` makes Next.js
  prerender a copy of every page per language at build time (about 210 static pages), so there is no per-request work.
- **English without a prefix = a config rewrite.** `next.config.mjs` rewrites `/` and every path that is not
  already `/en|/zh|/es`, `/api` or `/_next` (and does not look like a file) to `/en/...`. Public files and route
  handlers (`/ads.txt`, `/sitemap.xml`, `/robots.txt`, `/api/*`) are matched first and are not rewritten. No
  middleware and no edge function, so it works the same on Netlify, Vercel or `next start`.
- **The language comes from the URL.** `LanguageProvider` receives `lang` from the layout, so the server renders
  the page in its language and `useLang()` / `t(en, zh, es)` / `useDeviceText()` / `translations.ts` keep working
  unchanged.
- **Links stay in the language.** Use `Link` from `@/components/LocaleLink` (a drop-in for `next/link`), or
  `useLocalizeHref()` for `router.push` / callback URLs, or `localizePath(lang, href)` on the server. A test fails if
  a component imports `next/link` directly. External URLs, `#hash` links, `/api` routes and files are left alone.
- **Never render raw `usePathname()`.** A static English page is rendered as `/en/...` on the server but shown at
  `/...` in the browser, which would cause hydration errors. Use `useBarePathname()` / `stripLangPrefix()`. The
  route matchers (`isAutoAdsRoute`, `activeCollection`, `analyticsPath`) already do this, so `/zh/tools/mouse`
  behaves like `/tools/mouse` for ads, navigation and analytics.

## Language switcher and first visit

- The header switcher is three real links to the current page in each language (crawlable, with `hreflang`).
  A plain click remembers the choice in `localStorage` (`mb-lang`) and switches in place, keeping `?query` and `#hash`.
- **First visit:** the English pages carry a tiny inline script (`src/lib/lang-redirect.ts`) that sends a visitor to
  `/zh/...` or `/es/...` before anything is painted, using the saved choice, else the first supported browser
  language. It is client-side only, so the server always answers a URL with the language in that URL, and it never
  runs for crawlers (user agent), automated browsers (`navigator.webdriver`) or visitors who arrive from another page
  of this site. Choosing English in the switcher is remembered, so it is not undone.

## Metadata, canonical URLs, sitemap

- `src/lib/site-routes.ts` is the registry of public pages with their translated title and meta description. It is
  built from the same data as the catalogue (collections, device tools, games, mini-games, converters, drivers) plus
  a few static pages, so new catalogue entries are picked up automatically.
- `pageMetadata(lang, path)` / `routeMetadata(path)` (`src/lib/seo.ts`) add the title, description, **self-referencing
  canonical**, `hreflang` alternates for all languages plus `x-default` (English) and Open Graph tags. Draft pages
  (privacy, terms, cookies, privacy rights) are `noindex` in every language.
- `src/app/sitemap.ts` lists every language version of every public page with its alternates; `src/app/robots.ts`
  points crawlers at it. Utility pages are left out on purpose: `/contact`, `/leaderboard`, `/daily`, `/stats`,
  `/progress`, `/profile`, login and register, the drafts, `/tarot/cards`, and hidden or removed games.
- The Chinese and Spanish meta descriptions of the most-searched checks end with the phrase people actually type
  (`SEARCH_PHRASES` in `site-routes.ts`, e.g. 在线键盘测试, test de teclado online).

## Deploying

- Set **`NEXT_PUBLIC_SITE_URL`** (for example `https://www.example.com`) in the hosting environment. If it is empty,
  Netlify's `URL` (or Vercel's production URL) is used, and a production build with neither prints a warning and
  falls back to `http://localhost:3000`.
- Check after deploying: view-source of `/zh/tools/keyboard` shows `lang="zh-CN"`, the Chinese title and description,
  a canonical and four `hreflang` links; `/tools/keyboard` still works; `/sitemap.xml` lists the three languages.
  Submit the sitemap in Google Search Console and Bing Webmaster Tools (and Baidu if the Chinese audience matters).

## Adding a page

1. Create it under `src/app/[lang]/...`. Link with `LocaleLink`.
2. Register its path in `site-routes.ts` (catalogue-driven pages are already covered).
3. Export metadata: a server page uses `export const generateMetadata = routeMetadata("/path")` (or `pageMetadata`
   with its params); a client page (`"use client"`) gets a sibling `layout.tsx` that does the same and renders
   `<>{children}</>`.
4. `npx tsx --test tests/*.test.ts` checks that every registered page exists, exports metadata and has Chinese and
   Spanish copy, and that the sitemap and rewrite rules are consistent.

## Not covered / decisions for later

- Titles and headings still call the Chinese keyboard check 键盘检测 (not 键盘测试) and the Spanish one "Prueba de
  teclado" (not "test de teclado"); only the meta descriptions carry the other wording. Renaming is a product decision.
- Chinese is Simplified (`zh-CN`); there is no Traditional Chinese or region-specific Spanish version.
- `/tarot/cards` is English-only and not in the sitemap. Account, leaderboard and daily pages have localized URLs but no
  translated metadata beyond the site default.
- A 404 returns the right status; with a dynamic root layout Next.js 14.2 renders the localized 404 page on the client.
- Hosting-specific behaviour (Netlify's handling of the config rewrites and redirects) was verified with `next build` +
  `next start` and `next dev`, not on Netlify itself.
