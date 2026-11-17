import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_LANG, LANGS, LANG_META, isLang, langOfPath, localizePath, matchLang, preferredLang, stripLangPrefix } from "../src/lib/i18n";
import { BOT_USER_AGENT, LANG_REDIRECT_SCRIPT } from "../src/lib/lang-redirect";
import { absoluteUrl, getSiteUrl, languageAlternates } from "../src/lib/site-url";
import { isAutoAdsRoute } from "../src/lib/adsense";
import { activeCollection } from "../src/lib/collection-navigation";
import { analyticsPath } from "../src/lib/analytics";
import nextConfig from "../next.config.mjs";

test("English keeps the plain URLs; Chinese and Spanish get their own prefixes", () => {
  assert.deepEqual([...LANGS], ["en", "zh", "es"]);
  assert.equal(DEFAULT_LANG, "en");
  assert.equal(LANG_META.zh.htmlLang, "zh-CN");
  assert.equal(LANG_META.en.htmlLang, "en");
  assert.equal(LANG_META.es.htmlLang, "es");
  for (const lang of LANGS) assert.ok(isLang(lang));
  for (const value of ["", "fr", "EN", "zh-CN", null, undefined, 3]) assert.equal(isLang(value), false);
});

test("a language prefix is only recognised as a whole path segment", () => {
  assert.equal(langOfPath("/zh/tools/keyboard"), "zh");
  assert.equal(langOfPath("/es"), "es");
  assert.equal(langOfPath("/es?x=1"), "es");
  assert.equal(langOfPath("/en/tools"), "en");
  for (const path of ["/", "/tools/keyboard", "/zhang", "/english", "/estimate/zh", "/games/zh"]) assert.equal(langOfPath(path), "en", path);

  assert.equal(stripLangPrefix("/zh/tools/keyboard"), "/tools/keyboard");
  assert.equal(stripLangPrefix("/es/"), "/");
  assert.equal(stripLangPrefix("/zh"), "/");
  assert.equal(stripLangPrefix("/en/games/typing-test"), "/games/typing-test");
  assert.equal(stripLangPrefix("/zh?mode=motion"), "/?mode=motion");
  for (const path of ["/", "/tools/keyboard", "/zhang", "/english", "/games/zh"]) assert.equal(stripLangPrefix(path), path, path);
});

test("links move into the visitor's language and keep their query and hash", () => {
  assert.equal(localizePath("en", "/tools/keyboard"), "/tools/keyboard");
  assert.equal(localizePath("zh", "/tools/keyboard"), "/zh/tools/keyboard");
  assert.equal(localizePath("es", "/"), "/es");
  assert.equal(localizePath("en", "/"), "/");
  assert.equal(localizePath("zh", "/tools/screen?mode=motion#top"), "/zh/tools/screen?mode=motion#top");
  assert.equal(localizePath("zh", "/#tool-search"), "/zh#tool-search");
  assert.equal(localizePath("es", "/collections#tool-search"), "/es/collections#tool-search");
  // The same function switches an already-prefixed URL between languages.
  assert.equal(localizePath("es", "/zh/tools/keyboard"), "/es/tools/keyboard");
  assert.equal(localizePath("en", "/zh/tools/keyboard?x=1"), "/tools/keyboard?x=1");
  assert.equal(localizePath("en", "/es"), "/");
  assert.equal(localizePath("zh", "/en/about"), "/zh/about");
  // Never double-prefixed, whatever the starting point.
  for (const lang of LANGS) for (const start of LANGS) assert.equal(localizePath(lang, localizePath(start, "/about")), localizePath(lang, "/about"));
  // A path that merely starts with a language code is an ordinary page.
  assert.equal(localizePath("zh", "/zhang"), "/zh/zhang");
});

test("external links, hash links, API routes and files are never prefixed", () => {
  for (const href of [
    "https://policies.google.com/privacy?hl=zh", "http://example.com/", "//cdn.example.com/x", "mailto:hello@example.com", "tel:+1", "#main-content", "?mode=motion", "relative/path",
    "/api/auth/signin", "/api/scores", "/_next/static/x.js", "/brand/mindbench-laboratory-logo.png", "/resources/card/card.png", "/minigames/screw/index.html", "/ads.txt", "/sitemap.xml", "/robots.txt", "/models/gun.glb", "/files/report.PDF",
  ]) assert.equal(localizePath("zh", href), href, href);
  // A dot elsewhere in the path is still a page.
  assert.equal(localizePath("zh", "/drivers/razer/viper-v2-pro"), "/zh/drivers/razer/viper-v2-pro");
});

test("browser language: a saved choice wins, otherwise the first supported language in order", () => {
  assert.equal(preferredLang("zh", ["en-US"]), "zh");
  assert.equal(preferredLang("en", ["zh-CN", "es"]), "en");
  assert.equal(preferredLang(null, ["zh-Hans-CN", "en"]), "zh");
  assert.equal(preferredLang(null, ["fr-FR", "es-MX", "en"]), "es");
  assert.equal(preferredLang(null, ["en-US", "zh-Hans-CN"]), "en");
  assert.equal(preferredLang(null, ["ZH_cn"]), "zh");
  assert.equal(preferredLang(null, ["de", "ja"]), "en");
  assert.equal(preferredLang(null, []), "en");
  assert.equal(preferredLang("fr", ["es"]), "es", "an unknown stored value is ignored");
  assert.equal(matchLang("es-419"), "es");
  assert.equal(matchLang("english"), null);
  assert.equal(matchLang(""), null);
});

type RedirectCase = { ua?: string; webdriver?: boolean; referrer?: string; saved?: string | null; storageThrows?: boolean; languages?: string[]; path?: string; search?: string; hash?: string };
function runRedirectScript(options: RedirectCase) {
  const replaced: string[] = [];
  const context = {
    navigator: { userAgent: options.ua ?? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36", webdriver: options.webdriver ?? false, languages: options.languages ?? ["en-US"], language: options.languages?.[0] ?? "en-US" },
    document: { referrer: options.referrer ?? "" },
    location: { origin: "https://mindbench.example", pathname: options.path ?? "/", search: options.search ?? "", hash: options.hash ?? "", replace: (url: string) => replaced.push(url) },
    localStorage: { getItem: (key: string) => { if (options.storageThrows) throw new Error("blocked"); return key === "mb-lang" ? options.saved ?? null : null; } },
  };
  vm.runInNewContext(LANG_REDIRECT_SCRIPT, context);
  return replaced;
}

test("first visit: browsers that prefer Chinese or Spanish are sent to that URL", () => {
  assert.deepEqual(runRedirectScript({ languages: ["zh-CN", "en"], path: "/tools/keyboard" }), ["/zh/tools/keyboard"]);
  assert.deepEqual(runRedirectScript({ languages: ["es-MX"], path: "/collections/devices" }), ["/es/collections/devices"]);
  assert.deepEqual(runRedirectScript({ languages: ["zh-CN"], path: "/" }), ["/zh"]);
  assert.deepEqual(runRedirectScript({ languages: ["es"], path: "/tools/screen", search: "?mode=motion", hash: "#top" }), ["/es/tools/screen?mode=motion#top"]);
  assert.deepEqual(runRedirectScript({ languages: ["fr", "zh-TW"], path: "/about" }), ["/zh/about"]);
});

test("first visit: English and unsupported browser languages stay on the English URL", () => {
  assert.deepEqual(runRedirectScript({ languages: ["en-US", "zh-CN"], path: "/tools/keyboard" }), []);
  assert.deepEqual(runRedirectScript({ languages: ["de-DE"], path: "/tools/keyboard" }), []);
  assert.deepEqual(runRedirectScript({ languages: [], path: "/tools/keyboard" }), []);
});

test("a saved choice beats the browser language, in both directions", () => {
  assert.deepEqual(runRedirectScript({ saved: "zh", languages: ["en-US"], path: "/tools/mouse" }), ["/zh/tools/mouse"]);
  assert.deepEqual(runRedirectScript({ saved: "es", languages: ["zh-CN"], path: "/tools/mouse" }), ["/es/tools/mouse"]);
  assert.deepEqual(runRedirectScript({ saved: "en", languages: ["zh-CN"], path: "/tools/mouse" }), [], "choosing English is remembered");
  assert.deepEqual(runRedirectScript({ saved: "fr", languages: ["zh-CN"], path: "/" }), ["/zh"], "an unknown saved value falls back to the browser language");
  assert.deepEqual(runRedirectScript({ storageThrows: true, languages: ["es-ES"], path: "/" }), ["/es"], "blocked storage falls back to the browser language");
});

test("crawlers, automation and visitors already browsing the site are never redirected", () => {
  const zh = { languages: ["zh-CN"], path: "/tools/keyboard" };
  for (const ua of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116 Safari/537.36",
    "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
    "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
    "Mediapartners-Google",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36 Google-InspectionTool/1.0",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Mozilla/5.0 (compatible; Sogou web spider/4.0)",
    "Mozilla/5.0 (Linux; Android 7.0) Chrome-Lighthouse",
  ]) {
    assert.ok(BOT_USER_AGENT.test(ua), ua);
    assert.deepEqual(runRedirectScript({ ...zh, ua }), [], ua);
  }
  assert.deepEqual(runRedirectScript({ ...zh, webdriver: true }), [], "automated browsers see what the URL says");
  assert.deepEqual(runRedirectScript({ ...zh, referrer: "https://mindbench.example/zh/tools/mouse" }), [], "arriving from this site means the visitor chose this page");
  assert.deepEqual(runRedirectScript({ ...zh, saved: "zh", referrer: "https://mindbench.example/zh" }), []);
  assert.deepEqual(runRedirectScript({ ...zh, referrer: "https://www.google.com/" }), ["/zh/tools/keyboard"], "arriving from a search engine is still a first visit");
  assert.deepEqual(runRedirectScript({ ...zh, referrer: "https://mindbench.example.evil.test/" }), ["/zh/tools/keyboard"], "only this exact origin counts as the same site");
  // A normal desktop browser is not mistaken for a crawler.
  assert.equal(BOT_USER_AGENT.test("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15"), false);
  assert.equal(BOT_USER_AGENT.test("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Edg/126.0"), false);
});

test("the redirect script agrees with preferredLang for every combination of saved choice and browser language", () => {
  for (const saved of [null, "en", "zh", "es", "fr"]) {
    for (const languages of [[], ["en-US"], ["zh-CN"], ["es-ES", "en"], ["fr", "zh"], ["en", "zh"], ["de"]]) {
      const expected = preferredLang(saved, languages);
      const replaced = runRedirectScript({ saved, languages, path: "/about" });
      assert.deepEqual(replaced, expected === "en" ? [] : [`/${expected}/about`], JSON.stringify({ saved, languages }));
    }
  }
});

test("the public origin comes from configuration, then the hosting platform, then localhost", () => {
  assert.equal(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://www.mindbench.example/" }), "https://www.mindbench.example");
  assert.equal(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "mindbench.example" }), "https://mindbench.example");
  assert.equal(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://a.example/some/path?x=1" }), "https://a.example", "only the origin is used");
  assert.equal(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://a.example", URL: "https://b.netlify.app" }), "https://a.example");
  assert.equal(getSiteUrl({ URL: "https://b.netlify.app" }), "https://b.netlify.app");
  assert.equal(getSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "c.vercel.app" }), "https://c.vercel.app");
  assert.equal(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "not a url", URL: "" }), "http://localhost:3000");
  assert.equal(getSiteUrl({}), "http://localhost:3000");
});

test("every language version of a page is listed, with x-default pointing at English", () => {
  const origin = "https://mindbench.example";
  assert.equal(absoluteUrl("en", "/tools/keyboard", origin), "https://mindbench.example/tools/keyboard");
  assert.equal(absoluteUrl("zh", "/tools/keyboard", origin), "https://mindbench.example/zh/tools/keyboard");
  assert.equal(absoluteUrl("es", "/", origin), "https://mindbench.example/es");
  assert.equal(absoluteUrl("en", "/", origin), "https://mindbench.example/");
  assert.deepEqual(languageAlternates("/tools/keyboard", origin), {
    en: "https://mindbench.example/tools/keyboard",
    "zh-CN": "https://mindbench.example/zh/tools/keyboard",
    es: "https://mindbench.example/es/tools/keyboard",
    "x-default": "https://mindbench.example/tools/keyboard",
  });
  assert.deepEqual(languageAlternates("/", origin), { en: "https://mindbench.example/", "zh-CN": "https://mindbench.example/zh", es: "https://mindbench.example/es", "x-default": "https://mindbench.example/" });
});

test("language-prefixed paths keep ads, navigation and analytics working", () => {
  // Ads: the consent-gated loader treats every language of a page the same.
  for (const path of ["/", "/about", "/collections", "/collections/devices", "/tools/keyboard", "/convert", "/convert/image", "/drivers/razer/viper-v2-pro", "/leaderboard", "/daily", "/stats"]) {
    for (const lang of LANGS) assert.equal(isAutoAdsRoute(localizePath(lang, path)), true, `${lang} ${path}`);
  }
  for (const path of ["/games/typing-test", "/games/minigames/screw", "/iq-test", "/mbti", "/tarot", "/login", "/register", "/profile", "/progress", "/privacy"]) {
    for (const lang of LANGS) assert.equal(isAutoAdsRoute(localizePath(lang, path)), false, `${lang} ${path}`);
  }
  assert.equal(isAutoAdsRoute("/zh/"), true);
  assert.equal(isAutoAdsRoute("/es/tools/mouse/"), true);
  assert.equal(isAutoAdsRoute("/zh/tools/mouse?mode=x#y"), true);
  assert.equal(isAutoAdsRoute("/zhang"), false, "a path that only starts with a language code is not that language");
  assert.equal(isAutoAdsRoute("/en/tools/mouse"), true, "the internal /en address (seen by the server) matches too");

  // Navigation: the active collection is the same in every language.
  for (const lang of LANGS) {
    assert.equal(activeCollection(localizePath(lang, "/tools/keyboard")), "devices");
    assert.equal(activeCollection(localizePath(lang, "/games/typing-test")), "mind");
    assert.equal(activeCollection(localizePath(lang, "/collections/audio")), "utilities");
    assert.equal(activeCollection(localizePath(lang, "/convert")), "utilities");
    assert.equal(activeCollection(localizePath(lang, "/drivers/razer/viper-v2-pro")), "drivers");
    assert.equal(activeCollection(localizePath(lang, "/")), undefined);
  }

  // Analytics: private paths stay out, the language stays in.
  assert.equal(analyticsPath("/zh/tools/keyboard?note=secret#contact"), "/zh/tools/keyboard");
  assert.equal(analyticsPath("/es/convert/pdf-to-images?name=private.pdf"), "/es/convert/pdf-to-images");
  assert.equal(analyticsPath("/en/tools/keyboard"), "/tools/keyboard");
  assert.equal(analyticsPath("/zh"), "/zh");
  assert.equal(analyticsPath("/zh/profile/private-user"), "/other");
  assert.equal(analyticsPath("/es/convert/private.pdf"), "/other");
});

test("next.config rewrites English to /en and redirects /en back to the plain URL", async () => {
  const rewrites = await nextConfig.rewrites!() as { source: string; destination: string }[];
  const redirects = await nextConfig.redirects!() as { source: string; destination: string; permanent?: boolean }[];
  assert.deepEqual(rewrites[0], { source: "/", destination: "/en" });
  const page = rewrites[1];
  assert.equal(page.destination, "/en/:path");
  assert.ok(page.source.includes(`(?:${LANGS.join("|")})(?:/|$)`), "the rewrite exclusion lists exactly the supported languages");
  // `/:path(<regex>)`: Next compiles the group as written, so the same expression decides what is rewritten.
  const group = /^\/:path\((.*)\)$/.exec(page.source)?.[1];
  assert.ok(group, "the page rewrite is one /:path(...) group");
  const matcher = new RegExp(`^/(${group})$`);
  const rewritten = (path: string) => matcher.test(path);
  for (const path of ["/tools/keyboard", "/collections/devices", "/about", "/zhang", "/english", "/estimate/x", "/games/zh", "/mbti/characters", "/convert/pdf-to-images", "/login"]) assert.equal(rewritten(path), true, `${path} is served from /en`);
  for (const path of ["/zh", "/zh/tools/keyboard", "/es/about", "/en/tools/keyboard", "/api/auth/signin", "/api/scores", "/_next/static/chunks/main.js", "/_next/image", "/favicon.ico", "/brand/logo.png", "/sitemap.xml", "/robots.txt", "/ads.txt", "/minigames/screw/index.html"]) assert.equal(rewritten(path), false, `${path} is left alone`);
  assert.deepEqual(redirects.filter(r => r.source.startsWith("/en")).map(r => [r.source, r.destination, r.permanent]), [["/en", "/", true], ["/en/:path*", "/:path*", true]]);
  // The old collection aliases still redirect at the edge for English.
  assert.ok(redirects.some(r => r.source === "/collections/play" && r.destination === "/collections/discover"));
});

test("every internal link is localized: only LocaleLink and the language switcher use next/link directly", () => {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { if (name !== "resources") walk(full); continue; }
      if (!/\.(tsx?|jsx?)$/.test(name)) continue;
      if (/from\s+["']next\/link["']/.test(readFileSync(full, "utf8"))) offenders.push(full.replace(/\\/g, "/").replace(/^.*\/src\//, "src/"));
    }
  };
  walk(join(process.cwd(), "src"));
  assert.deepEqual(offenders.sort(), ["src/components/Header.tsx", "src/components/LocaleLink.tsx"]);
});
