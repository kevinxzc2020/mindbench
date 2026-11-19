import test from "node:test";
import assert from "node:assert/strict";
import { CATALOG } from "../src/lib/collections";
import { nextTests } from "../src/lib/next-tests";
import { GAMES } from "../src/lib/utils";
import { DEVICE_TOOLS, TOUCH_FRIENDLY_CHECKS } from "../src/components/device/diagnostic-copy";

test("every visible game ends with three different places to go next, never itself", () => {
  for (const game of GAMES) {
    if ("hidden" in game && game.hidden) continue;
    const next = nextTests(game.id);
    assert.equal(next.length, 3, game.id);
    assert.equal(new Set(next.map(entry => entry.id)).size, 3, game.id);
    for (const entry of next) {
      assert.notEqual(entry.id, game.id);
      assert.ok(entry.href?.startsWith("/games/"), `${game.id} -> ${entry.href}`);
    }
  }
});

test("ability tests lead to other ability tests, and an unknown game still gets suggestions", () => {
  const ability = CATALOG.mind.map(entry => entry.id);
  for (const id of ability) for (const entry of nextTests(id)) assert.ok(ability.includes(entry.id), `${id} -> ${entry.id}`);
  assert.equal(nextTests("no-such-game").length, 3);
});

test("checks offered to touch-only visitors exist and need neither a keyboard nor a mouse", () => {
  const devices = new Map(CATALOG.devices.map(entry => [entry.id, entry]));
  assert.ok(TOUCH_FRIENDLY_CHECKS.length >= 3);
  for (const id of TOUCH_FRIENDLY_CHECKS) {
    assert.equal(devices.get(id)?.href, `/tools/${id}`, id);
    assert.ok(DEVICE_TOOLS[id].title.every(Boolean), id);
    assert.ok(!["keyboard", "mouse", "wheel", "trackpad"].includes(id), id);
  }
});
