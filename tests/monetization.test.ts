import test from "node:test";
import assert from "node:assert/strict";
import { analyticsEnabled, analyticsPath, analyticsPayload, analyticsReferrer, setAnalyticsSender, trackJourney, type JourneyEvent } from "../src/lib/analytics";
import { NO_CONSENT, parseConsent } from "../src/lib/site-consent";
import { getAdSenseConfig, isLocalAdPreview } from "../src/lib/adsense";
import { REPORT_TOOLS } from "../src/lib/device-history";
import { CHECKUP_NEXT, checkupRecommendations } from "../src/lib/checkup-recommendations";
import { CATALOG } from "../src/lib/collections";

test("local previews never send analytics even after opt-in; missing IDs stay disabled", () => {
  for (const host of ["localhost", "preview.localhost", "127.0.0.1", "127.1.2.3", "::1", "[::1]"]) {
    assert.equal(isLocalAdPreview(host), true);
    assert.equal(analyticsEnabled("G-TEST123", true, host), false);
  }
  assert.equal(analyticsEnabled(null, true, "example.com"), false);
  assert.equal(analyticsEnabled("bad", true, "example.com"), false);
  assert.equal(analyticsEnabled("G-TEST123", false, "example.com"), false);
  assert.equal(analyticsEnabled("G-TEST123", true, "example.com"), true);
});

test("malformed or outdated consent cannot grant tracking", () => {
  for (const raw of [null, "bad json", "{}", '{"version":0,"analytics":true,"advertising":true}', '{"version":1,"analytics":"true","advertising":true}']) assert.equal(parseConsent(raw), null);
  assert.deepEqual(parseConsent(JSON.stringify(NO_CONSENT)), NO_CONSENT);
  assert.deepEqual(parseConsent('{"version":1,"analytics":true,"advertising":false,"raw":"private"}'), { version: 1, analytics: true, advertising: false });
});

test("tracking strips non-schema data and never buffers pre-consent events", () => {
  const calls: unknown[] = [];
  setAnalyticsSender(null);
  assert.equal(trackJourney({ name: "tool_start", tool: "keyboard" }), false);
  setAnalyticsSender((name, params) => calls.push({ name, params }));
  assert.deepEqual(calls, []);
  const event = { name: "tool_complete", tool: "keyboard", notes: "private", input: "secret", deviceId: "private" } as JourneyEvent;
  assert.equal(trackJourney(event), true);
  assert.deepEqual(calls, [{ name: "tool_complete", params: { tool_id: "keyboard" } }]);
  assert.equal(analyticsPayload({ name: "recommendation_click", tool: "mouse", target: "email@example.com", kind: "game" }), null);
  assert.equal(analyticsPayload({ name: "tool_start", tool: "unknown" } as unknown as JourneyEvent), null);
  setAnalyticsSender(null);
  assert.equal(trackJourney(event), false);
  assert.equal(calls.length, 1);
});

test("analytics URLs exclude query parameters, fragments and private identifiers", () => {
  assert.equal(analyticsPath("/tools/screen?note=secret#contact"), "/tools/screen");
  assert.equal(analyticsPath("/profile/private-user"), "/other");
  assert.equal(analyticsPath("/auth/reset/token"), "/other");
  assert.equal(analyticsReferrer("https://example.com/private?email=person#secret"), "https://example.com");
  assert.equal(analyticsReferrer("javascript:alert(1)"), "");
});

test("each completed check has available unique tests, a game and a different next device check", () => {
  for (const tool of REPORT_TOOLS) {
    const choices = checkupRecommendations(tool);
    assert.equal(choices.filter(c => c.kind === "test").length, 2, tool);
    assert.equal(choices.filter(c => c.kind === "game").length, 1, tool);
    assert.equal(new Set(choices.map(c => c.entry.href)).size, 3, tool);
    assert.ok(choices.every(c => c.entry.image && c.entry.href), tool);
    assert.notEqual(CHECKUP_NEXT[tool].next, tool);
    assert.ok(CATALOG.devices.some(c => c.id === CHECKUP_NEXT[tool].next && c.href));
  }
  assert.ok(checkupRecommendations("keyboard").some(c => c.entry.id === "typing-test"));
  assert.ok(checkupRecommendations("mouse").some(c => c.entry.id === "cps-test"));
  assert.ok(checkupRecommendations("screen").some(c => c.entry.id === "visual-memory"));
});

test("home and completion ads require their own valid public slot identifiers", () => {
  const keys = ["NEXT_PUBLIC_ADSENSE_MODE", "NEXT_PUBLIC_ADSENSE_HOME_SLOT", "NEXT_PUBLIC_ADSENSE_RESULT_SLOT"] as const;
  const previous = keys.map(key => process.env[key]);
  try {
    process.env.NEXT_PUBLIC_ADSENSE_MODE = "live";
    process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT = "1234567890";
    process.env.NEXT_PUBLIC_ADSENSE_RESULT_SLOT = "invalid";
    assert.equal(getAdSenseConfig().homeSlotId, "1234567890");
    assert.equal(getAdSenseConfig().resultSlotId, null);
    process.env.NEXT_PUBLIC_ADSENSE_RESULT_SLOT = "9876543210";
    assert.equal(getAdSenseConfig().resultSlotId, "9876543210");
    process.env.NEXT_PUBLIC_ADSENSE_MODE = "typo";
    assert.equal(getAdSenseConfig().mode, "off");
  } finally { keys.forEach((key, i) => { if (previous[i] === undefined) delete process.env[key]; else process.env[key] = previous[i]; }); }
});
