import test from "node:test";
import assert from "node:assert/strict";
import { acceptsPointer, coverageCell, freshPadStats, freshPointerStats, interruptPointers, isEdgeCell, normalizePoint, observePad, pointerSample, summarizeRest, type PointerSample } from "../src/lib/extended-diagnostics";
import { compareRecords, HISTORY_LIMIT, mergeHistory, metric, parseHistory, serializeHistory, validateRecord, type CheckupRecord } from "../src/lib/device-history";

const sample = (overrides: Partial<PointerSample> = {}): PointerSample => ({ id: 1, type: "touch", x: .5, y: .5, pressure: .4, tiltX: 0, tiltY: 0, twist: 0, buttons: 1, width: 10, height: 10, ...overrides });
test("coverage boundaries stay within the grid, including bottom/right edges", () => {
  assert.equal(coverageCell(0, 0), 0); assert.equal(coverageCell(1, 1), 47);
  assert.equal(coverageCell(-.1, .5), -1); assert.equal(coverageCell(.5, 1.1), -1);
  assert.equal(coverageCell(NaN, 0), -1); assert.equal(coverageCell(0, 0, 0, 6), -1);
  assert.equal(Array.from({ length: 48 }, (_, i) => i).filter(i => isEdgeCell(i)).length, 24);
});
test("normalization does not invent samples outside the surface or zero-sized areas", () => {
  assert.deepEqual(normalizePoint(100, 50, 200, 100), { x: .5, y: .5, pressure: 0 });
  assert.equal(normalizePoint(1, 1, 0, 10), null); assert.equal(normalizePoint(11, 1, 10, 10), null);
});
test("touch and pen tools reject mouse input", () => {
  const s = freshPointerStats(); pointerSample(s, "touch", "down", sample({ type: "mouse" }));
  assert.equal(s.downs, 0); assert.equal(s.cells.size, 0); assert.equal(s.ignored, 1);
  assert.equal(acceptsPointer("pen", "touch"), false); assert.equal(acceptsPointer("pen", "pen"), true);
  assert.equal(acceptsPointer("trackpad", "mouse"), true);
});
test("multiple contacts maintain independent release and cancel states", () => {
  const s = freshPointerStats(); pointerSample(s, "touch", "down", sample()); pointerSample(s, "touch", "down", sample({ id: 2, x: 0, y: 0 }));
  assert.equal(s.maxContacts, 2); assert.equal(s.cells.size, 2);
  pointerSample(s, "touch", "up", sample()); assert.equal(s.contacts.size, 1); assert.equal(s.completed, 1);
  pointerSample(s, "touch", "cancel", sample({ id: 2 })); assert.equal(s.contacts.size, 0); assert.equal(s.canceled, 1);
  pointerSample(s, "touch", "up", sample()); assert.equal(s.completed, 1);
});
test("pen hover does not count as a press, coverage or measured contact pressure", () => {
  const s = freshPointerStats(); pointerSample(s, "pen", "move", sample({ type: "pen", buttons: 0, pressure: 0 }));
  assert.equal(s.cells.size, 0); assert.equal(s.pressureMin, null); assert.equal(s.downs, 0);
  pointerSample(s, "pen", "down", sample({ type: "pen", pressure: .2 }));
  pointerSample(s, "pen", "move", sample({ type: "pen", pressure: .9, tiltX: 30 }));
  assert.equal(s.pressureMin, .2); assert.equal(s.pressureMax, .9); assert.equal(s.tiltMax, 30);
});
test("pausing clears held contacts without inventing a physical release", () => {
  const s = freshPointerStats(); pointerSample(s, "touch", "down", sample()); interruptPointers(s);
  assert.equal(s.contacts.size, 0); assert.equal(s.completed, 0); assert.equal(s.interruptions, 1);
  pointerSample(s, "touch", "move", sample()); assert.equal(s.downs, 1); assert.equal(s.received, 1);
});
test("drawing memory is bounded", () => {
  const s = freshPointerStats();
  for (let id = 0; id < 40; id++) { pointerSample(s, "touch", "down", sample({ id })); for (let i = 0; i < 400; i++) pointerSample(s, "touch", "move", sample({ id })); pointerSample(s, "touch", "up", sample({ id })); }
  assert.equal(s.strokes.length, 32); assert.equal(s.strokes[0].points.length, 320); assert.equal(s.contacts.size, 0);
});
test("gamepad press transitions do not count held buttons once per animation frame", () => {
  const s = freshPadStats(); const pressed = { axes: [0, .2], buttons: [{ value: 1, pressed: true }] };
  observePad(s, pressed); observePad(s, pressed); assert.equal(s.pressed[0], 1);
  observePad(s, { axes: [-1, 1], buttons: [{ value: 0, pressed: false }] }); observePad(s, pressed);
  assert.equal(s.pressed[0], 2); assert.deepEqual(s.min, [-1, .2]); assert.deepEqual(s.max, [0, 1]);
});
test("hands-off summaries preserve nonzero resting axes and do not assign a pass verdict", () => {
  const result = summarizeRest([[.1, -1], [.3, -1]]);
  assert.equal(result?.samples, 2); assert.deepEqual(result?.mean, [.2, -1]);
  assert.ok(Math.abs(result!.maxDeviation[0] - .1) < 1e-9); assert.equal(result!.maxDeviation[1], 0);
  assert.equal(summarizeRest([]), null); assert.equal(summarizeRest([[0], [0, 1]]), null); assert.equal(summarizeRest([[NaN]]), null);
});
const record = (id = "a", at = "2026-11-10T12:00:00.000Z"): CheckupRecord => ({ id, at, tool: "keyboard", name: "Test keyboard", note: "", result: "unsure", metrics: [metric("presses", ["Presses", "按下次数", "Pulsaciones"], 3)] });
test("history export/import preserves bounded summary data", () => { const r = record(); assert.deepEqual(parseHistory(serializeHistory([r])), [r]); });
test("history strips fields outside the summary schema", () => {
  const r = validateRecord({ ...record(), deviceId: "private-id", image: "data:image/png;base64,abc", recording: "blob:audio", rawKeys: ["a"] });
  assert.deepEqual(r, record());
});
test("history rejects unsupported formats, malformed metrics and duplicate IDs", () => {
  assert.throws(() => parseHistory('{"version":1,"records":[]}'));
  assert.throws(() => validateRecord({ ...record(), tool: "unknown" }));
  assert.throws(() => validateRecord({ ...record(), at: "invalid" }));
  assert.throws(() => validateRecord({ ...record(), metrics: [metric("p", ["A", "B", "C"], Infinity)] }));
  assert.throws(() => validateRecord({ ...record(), metrics: [...record().metrics, ...record().metrics] }));
  assert.throws(() => parseHistory(serializeHistory([record(), record()])));
  assert.throws(() => parseHistory(" ".repeat(1_000_001)));
});
test("history merges skip existing IDs and retain the latest bounded records", () => {
  const existing = Array.from({ length: HISTORY_LIMIT }, (_, i) => record(String(i), new Date(Date.UTC(2026, 10, 10, 0, 0, i)).toISOString()));
  const newest = record("new", "2026-11-11T00:00:00.000Z");
  const merged = mergeHistory(existing, [newest, { ...existing[50], name: "Do not overwrite" }]);
  assert.equal(merged.length, HISTORY_LIMIT); assert.equal(merged[0].id, "new"); assert.ok(!merged.some(r => r.id === "0"));
  assert.equal(merged.find(r => r.id === "50")?.name, "Test keyboard");
});
test("comparison is restricted to the same tool and compatible numeric units", () => {
  const a = record(), b = { ...record("b"), metrics: [metric("presses", ["P", "P", "P"], 5)] };
  assert.equal(compareRecords(a, b)[0].delta, 2);
  assert.equal(compareRecords(a, { ...b, metrics: [metric("presses", ["P", "P", "P"], 5, "ms")] })[0].delta, null);
  assert.throws(() => compareRecords(a, { ...b, tool: "mouse" }));
});
