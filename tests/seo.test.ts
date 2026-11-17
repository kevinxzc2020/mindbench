import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { LANGS, LANG_META } from "../src/lib/i18n";
import { absoluteUrl, getSiteUrl } from "../src/lib/site-url";
import { pageMetadata, siteMetadata } from "../src/lib/seo";
import { registeredPaths, routeInfo, sitemapPaths } from "../src/lib/site-routes";
import { CATALOG } from "../src/lib/collections";
import { CONVERTERS } from "../src/lib/converters";
import { DRIVER_DEVICES } from "../src/lib/driver-library";
import { MINI_GAMES } from "../src/lib/mini-games";
import { GAMES } from "../src/lib/utils";
import { DEVICE_TOOLS } from "../src/components/device/diagnostic-copy";
import { COLLECTIONS } from "../src/lib/collections";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";

const APP = join(process.cwd(), "src", "app", "[lang]");

test("the sitemap covers every public page once, and leaves drafts and account pages out", () => {
  const paths = sitemapPaths();
  assert.equal(new Set(paths).size, paths.length, "no duplicates");
  for (const path of paths) assert.match(path, /^\/[^?#]*$/, path);
  const expected = [
    "/", "/collections", ...COLLECTIONS.map(c => `/collections/${c.id}`),
    ...Object.keys(DEVICE_TOOLS).map(id => `/tools/${id}`),
    ...GAMES.filter(g => !("hidden" in g && g.hidden)).map(g => `/games/${g.id}`),
    ...MINI_GAMES.map(g => `/games/minigames/${g.slug}`),
    "/convert", ...CONVERTERS.map(c => `/convert/${c.id}`),
    ...DRIVER_DEVICES.map(d => `/drivers/${d.brand}/${d.slug}`),
    "/about", "/iq-test", "/mbti", "/mbti/characters", "/tarot",
  ];
  assert.deepEqual([...paths].sort(), [...expected].sort());
  for (const path of ["/privacy", "/terms", "/cookies", "/privacy-rights", "/login", "/register", "/profile", "/stats", "/progress", "/games/black-hole", "/games/tile-match", "/fortune"]) assert.ok(!paths.includes(path), path);
});

test("every internal link target in the catalogue and driver pages has translated page metadata", () => {
  const targets = new Set<string>();
  for (const entries of Object.values(CATALOG)) for (const entry of entries) if (entry.href && !entry.external) targets.add(entry.href.split(/[?#]/)[0]);
  for (const device of DRIVER_DEVICES) for (const test of device.tests) targets.add(test.href);
  assert.ok(targets.size > 40);
  for (const path of Array.from(targets)) assert.ok(routeInfo(path), `${path} is linked from the site but has no entry in src/lib/site-routes.ts`);
});

test("each page gets its own translated title and description, a self canonical and all alternates", () => {
  const origin = getSiteUrl();
  for (const path of registeredPaths()) {
    const info = routeInfo(path)!;
    for (const lang of LANGS) {
      const meta = pageMetadata(lang, path);
      const copy = info.copy[lang];
      assert.ok(copy.title.length > 3 && copy.description.length >= 6, `${lang} ${path} has copy`);
      assert.equal(meta.title, copy.title);
      assert.equal(meta.description, copy.description);
      assert.equal(meta.openGraph?.locale, LANG_META[lang].ogLocale);
      assert.equal((meta.openGraph as { url?: string })?.url, absoluteUrl(lang, path, origin));
      if (info.noindex) {
        assert.deepEqual(meta.robots, { index: false, follow: true }, `${path} stays out of search results`);
        assert.equal(meta.alternates, undefined);
        continue;
      }
      assert.equal(meta.alternates?.canonical, absoluteUrl(lang, path, origin), `${lang} ${path} canonical points at its own language version`);
      assert.deepEqual(meta.alternates?.languages, {
        en: absoluteUrl("en", path, origin), "zh-CN": absoluteUrl("zh", path, origin), es: absoluteUrl("es", path, origin), "x-default": absoluteUrl("en", path, origin),
      });
    }
    // The Chinese and Spanish titles are real translations, not the English text.
    assert.notEqual(info.copy.zh.title, info.copy.en.title, `${path} zh title`);
    assert.notEqual(info.copy.zh.description, info.copy.en.description, `${path} zh description`);
    assert.match(info.copy.zh.title + info.copy.zh.description, /[一-鿿]/, `${path} zh copy is Chinese`);
  }
  assert.deepEqual(pageMetadata("zh", "/not-a-page"), {});
});

test("tool pages are described in the visitor's own language", () => {
  assert.equal(pageMetadata("en", "/tools/keyboard").title, "Keyboard tester | MindBench");
  assert.equal(pageMetadata("zh", "/tools/keyboard").title, "键盘检测 | MindBench");
  assert.equal(pageMetadata("es", "/tools/keyboard").title, "Prueba de teclado | MindBench");
  assert.equal(pageMetadata("en", "/tools/keyboard").description, DEVICE_TOOLS.keyboard.intro[0], "English metadata is unchanged");
  // Chinese and Spanish descriptions also carry the phrase people actually search for.
  assert.equal(pageMetadata("zh", "/tools/keyboard").description, `${DEVICE_TOOLS.keyboard.intro[1]} 在线键盘测试，免费使用，无需安装或登录。`);
  assert.match(pageMetadata("zh", "/tools/keyboard").description as string, /键盘测试/);
  assert.match(pageMetadata("es", "/tools/keyboard").description as string, /^Cada tecla, cada pulsación\..* Test de teclado online/);
  assert.equal(pageMetadata("es", "/tools/webcam").description, `${DEVICE_TOOLS.webcam.intro[2]} Test de cámara web online, sin instalar nada.`);
  assert.equal(pageMetadata("zh", "/tools/gamepad").description, DEVICE_TOOLS.gamepad.intro[1], "tools without a search phrase keep their plain description");
  assert.equal(pageMetadata("en", "/collections/devices").title, "Device checkup | MindBench");
  assert.equal(pageMetadata("zh", "/collections/devices").title, "设备自检 | MindBench");
  for (const lang of LANGS) {
    const home = siteMetadata(lang);
    assert.equal(home.title, pageMetadata(lang, "/").title);
    assert.equal(home.description, pageMetadata(lang, "/").description);
  }
  assert.equal(pageMetadata("en", "/").title, "MindBench — Device checks & everyday tools");
});

test("the sitemap lists every language version, each with the full set of alternates", () => {
  const origin = getSiteUrl();
  const entries = sitemap();
  const paths = sitemapPaths();
  assert.equal(entries.length, paths.length * LANGS.length);
  assert.equal(new Set(entries.map(entry => entry.url)).size, entries.length, "every URL is listed once");
  for (const path of paths) {
    for (const lang of LANGS) {
      const entry = entries.find(candidate => candidate.url === absoluteUrl(lang, path, origin));
      assert.ok(entry, `${lang} ${path}`);
      assert.deepEqual(entry.alternates?.languages, {
        en: absoluteUrl("en", path, origin), "zh-CN": absoluteUrl("zh", path, origin), es: absoluteUrl("es", path, origin), "x-default": absoluteUrl("en", path, origin),
      });
    }
  }
  for (const lang of ["zh", "es"] as const) assert.ok(entries.some(entry => entry.url === `${origin}/${lang}/tools/keyboard`));
  assert.ok(entries.some(entry => entry.url === `${origin}/tools/keyboard`));
  assert.ok(entries.some(entry => entry.url === `${origin}/zh` && entry.alternates?.languages?.["x-default"] === `${origin}/`));
  assert.ok(entries.every(entry => !/\/en(\/|$)/.test(entry.url.slice(origin.length))), "the internal /en address is never published");
});

test("robots.txt points crawlers at the sitemap", () => {
  const result = robots();
  assert.equal(result.sitemap, `${getSiteUrl()}/sitemap.xml`);
  assert.deepEqual(result.rules, [{ userAgent: "*", allow: "/", disallow: ["/api/"] }]);
});

/** Route files for a public path: literal folders first, then the dynamic `[param]` folder. */
function folderFor(path: string) {
  let dir = APP;
  for (const segment of path.split("/").filter(Boolean)) {
    const literal = join(dir, segment);
    if (existsSync(literal) && statSync(literal).isDirectory()) { dir = literal; continue; }
    const dynamic = readdirSync(dir).find(name => /^\[[^\].]+\]$/.test(name) && statSync(join(dir, name)).isDirectory());
    assert.ok(dynamic, `no route folder for ${path}`);
    dir = join(dir, dynamic);
  }
  return dir;
}

test("every registered page exists and exports translated metadata from its page or layout", () => {
  for (const path of registeredPaths()) {
    const dir = folderFor(path);
    const page = join(dir, "page.tsx");
    assert.ok(existsSync(page), `${path} has a page`);
    const source = [page, join(dir, "layout.tsx")].filter(existsSync).map(file => readFileSync(file, "utf8")).join("\n");
    assert.match(source, /generateMetadata/, `${path} must export generateMetadata (page.tsx, or layout.tsx for client pages)`);
  }
});

test("no page hard-codes English-only metadata", () => {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (/\.(tsx?|jsx?)$/.test(name) && /export\s+const\s+metadata\b/.test(readFileSync(full, "utf8"))) offenders.push(full);
    }
  };
  walk(APP);
  assert.deepEqual(offenders, []);
});
