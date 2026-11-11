import test from "node:test";
import assert from "node:assert/strict";
import { CATALOG, COLLECTIONS, matchesEntry } from "../src/lib/collections";
import { activeCollection, collectionRedirect, COLLECTION_NAV } from "../src/lib/collection-navigation";
import { GAMES } from "../src/lib/utils";
import { MINI_GAMES } from "../src/lib/mini-games";

test("homepage and navigation expose the same five categories in the agreed order", () => {
  assert.deepEqual(COLLECTIONS.map(c => c.id), ["devices", "utilities", "drivers", "mind", "discover"]);
  assert.deepEqual(COLLECTION_NAV.map(c => c.name.zh), ["设备自检", "实用工具", "驱动资料", "能力测试", "趣味探索"]);
  assert.deepEqual(COLLECTIONS.map(c => c.name), COLLECTION_NAV.map(c => c.name));
});

test("reorganization preserves each visible game once and keeps casual games out of ability tests", () => {
  const entries = Object.values(CATALOG).flat();
  for (const game of GAMES) {
    const href = `/games/${game.id}`;
    const matches = entries.filter(e => e.href === href);
    if ("hidden" in game && game.hidden) { assert.equal(matches.length, 0); continue; }
    assert.equal(matches.length, 1, href);
    const expected = game.category === "cognitive" ? "mind" : "discover";
    assert.ok(CATALOG[expected].some(e => e.href === href), href);
    assert.equal(activeCollection(href), expected);
  }
  for (const game of MINI_GAMES) {
    const href = `/games/minigames/${game.slug}`;
    assert.equal(entries.filter(e => e.href === href).length, 1);
    assert.ok(CATALOG.discover.some(e => e.href === href && e.group.zh === "小游戏"));
    assert.equal(activeCollection(href), "discover");
  }
  for (const entries of Object.values(CATALOG)) assert.equal(new Set(entries.map(e => e.id)).size, entries.length);
});

test("personality activities remain discoverable together with games in all supported languages", () => {
  for (const id of ["iq", "mbti", "tarot"]) assert.ok(CATALOG.discover.some(e => e.id === id && e.href));
  for (const query of ["小游戏", "Mini-games", "Minijuegos"]) assert.ok(CATALOG.discover.some(e => matchesEntry(e, query)));
  for (const collection of COLLECTIONS) {
    for (const lang of ["en", "zh", "es"] as const) {
      assert.ok(collection.name[lang]);
      for (const entry of CATALOG[collection.id]) assert.ok(entry.title[lang] && entry.description[lang] && entry.group[lang]);
    }
  }
});

test("old collection bookmarks redirect, while unknown slugs do not become valid categories", () => {
  assert.equal(collectionRedirect("play"), "/collections/discover");
  assert.equal(collectionRedirect("audio"), "/collections/utilities");
  for (const slug of ["mind", "unknown", "toString", "__proto__"]) assert.equal(collectionRedirect(slug), undefined);
});

test("navigation recognizes detail routes without selecting a category on account or records pages", () => {
  for (const path of ["/tools/keyboard", "/tools/screen?mode=motion", "/tools/microphone#recording"]) assert.equal(activeCollection(path), "devices");
  assert.equal(activeCollection("/drivers/razer/viper-v2-pro"), "drivers");
  for (const path of ["/mbti", "/mbti/results", "/iq-test", "/tarot"]) assert.equal(activeCollection(path), "discover");
  assert.equal(activeCollection("/collections/audio"), "utilities");
  assert.equal(activeCollection("/collections/play"), "discover");
  for (const path of ["/", "/progress", "/leaderboard", "/stats", "/collections", "/collections/toString", "/games/unknown"]) assert.equal(activeCollection(path), undefined);
});

test("utilities link to the available recorder without advertising unfinished voice effects as runnable", () => {
  assert.equal(CATALOG.utilities.find(e => e.id === "voice-recorder")?.href, "/tools/microphone");
  for (const id of ["voice-effects", "pitch", "voice-routing"]) assert.equal(CATALOG.utilities.find(e => e.id === id)?.href, undefined);
});
