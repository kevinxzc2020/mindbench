/** Browser input observations, not a hardware diagnosis. All times are monotonic milliseconds. */
export const LOG_LIMIT = 5000;
export type DiagnosticTool = "keyboard" | "mouse" | "wheel" | "screen" | "speakers" | "microphone";
export type LogKind = "input" | "notice" | "suspect";
export interface InputLog { at: number; event: string; target: string; detail: string; kind: LogKind }
export interface SessionLog { log: InputLog[]; logged: number; interruptions: number }
export function appendLog(state: SessionLog, entry: InputLog) {
  state.logged++;
  state.log.push(entry);
  if (state.log.length > LOG_LIMIT) state.log.splice(0, state.log.length - LOG_LIMIT);
}
const log = (s: SessionLog, at: number, event: string, target: string, detail = "", kind: LogKind = "input") => appendLog(s, { at, event, target, detail, kind });
const freshLog = (): SessionLog => ({ log: [], logged: 0, interruptions: 0 });

export interface KeyResult { presses: number; releases: number; repeats: number; suspects: number; heldSince: number | null; lastUp: number | null; lastHold: number | null; shortestGap: number | null }
export interface KeyboardState extends SessionLog { keys: Record<string, KeyResult>; held: string[]; presses: number; repeats: number; suspects: number; maxChord: number; last: string }
export const createKeyboardState = (): KeyboardState => ({ ...freshLog(), keys: {}, held: [], presses: 0, repeats: 0, suspects: 0, maxChord: 0, last: "" });
export function keyDown(s: KeyboardState, code: string, repeat: boolean, at: number, threshold: number) {
  if (!code) return;
  const k = s.keys[code] ?? (s.keys[code] = { presses: 0, releases: 0, repeats: 0, suspects: 0, heldSince: null, lastUp: null, lastHold: null, shortestGap: null });
  s.last = code;
  // OS auto-repeat is not a second physical press and must never be labelled chatter.
  if (repeat) { k.repeats++; s.repeats++; log(s, at, "repeat", code); return; }
  if (k.heldSince !== null) { k.suspects++; s.suspects++; log(s, at, "down-without-up", code, "No release was received between keydown events", "suspect"); return; }
  if (k.lastUp !== null) {
    const gap = Math.max(0, at - k.lastUp);
    k.shortestGap = k.shortestGap === null ? gap : Math.min(k.shortestGap, gap);
    if (gap < threshold) { k.suspects++; s.suspects++; log(s, at, "rapid-repress", code, `${gap.toFixed(1)} ms < ${threshold} ms`, "suspect"); }
  }
  k.presses++; s.presses++; k.heldSince = at;
  s.held.push(code); s.maxChord = Math.max(s.maxChord, s.held.length);
  log(s, at, "keydown", code);
}
export function keyUp(s: KeyboardState, code: string, at: number) {
  const k = s.keys[code];
  if (!k || k.heldSince === null) return; // A key held before starting isn't a failed key.
  k.releases++; k.lastHold = Math.max(0, at - k.heldSince); k.heldSince = null; k.lastUp = at;
  s.held = s.held.filter(k => k !== code); s.last = code;
  log(s, at, "keyup", code, `${k.lastHold.toFixed(1)} ms held`);
}
export function interruptKeyboard(s: KeyboardState, at: number, reason: string) {
  for (const key of Object.values(s.keys)) { key.heldSince = null; key.lastUp = null; }
  s.held = []; s.interruptions++; log(s, at, "paused", "keyboard", reason, "notice");
}

export const BUTTON_BITS = [1, 4, 2, 8, 16] as const;
export const BUTTON_NAMES = ["primary", "middle", "secondary", "back", "forward"] as const;
export interface ButtonResult { downs: number; ups: number; since: number | null; lastDown: number | null; shortestInterval: number | null; lastHold: number | null; rapid: number }
export interface Point { x: number; y: number }
export interface MouseState extends SessionLog { buttons: ButtonResult[]; rapid: number; doubleClicks: number; moves: number; trail: Point[]; position: Point | null; drag: "idle" | "dragging" | "complete" | "early-release" | "interrupted"; dragAttempts: number; dragCompleted: number; dragEarly: number; missingReleases: number }
export const createMouseState = (): MouseState => ({ ...freshLog(), buttons: BUTTON_NAMES.map(() => ({ downs: 0, ups: 0, since: null, lastDown: null, shortestInterval: null, lastHold: null, rapid: 0 })), rapid: 0, doubleClicks: 0, moves: 0, trail: [], position: null, drag: "idle", dragAttempts: 0, dragCompleted: 0, dragEarly: 0, missingReleases: 0 });
export const inDragStart = (p: Point) => Math.hypot(p.x - 14, p.y - 50) <= 10;
export const inDragEnd = (p: Point) => Math.hypot(p.x - 86, p.y - 50) <= 10;
export function mouseDown(s: MouseState, button: number, at: number, threshold: number, point: Point, dragMode: boolean) {
  const b = s.buttons[button]; if (!b || b.since !== null) return;
  if (b.lastDown !== null) {
    const gap = Math.max(0, at - b.lastDown); b.shortestInterval = b.shortestInterval === null ? gap : Math.min(b.shortestInterval, gap);
    if (gap < threshold) { b.rapid++; s.rapid++; log(s, at, "rapid-click-pair", BUTTON_NAMES[button], `${gap.toFixed(1)} ms < ${threshold} ms`, "suspect"); }
  }
  b.downs++; b.since = at; b.lastDown = at;
  log(s, at, "mousedown", BUTTON_NAMES[button]);
  if (button === 0 && dragMode && inDragStart(point)) { s.drag = "dragging"; s.dragAttempts++; s.trail = [point]; }
}
export function mouseUp(s: MouseState, button: number, at: number, point: Point) {
  const b = s.buttons[button]; if (!b || b.since === null) return;
  b.ups++; b.lastHold = Math.max(0, at - b.since); b.since = null;
  log(s, at, "mouseup", BUTTON_NAMES[button], `${b.lastHold.toFixed(1)} ms held`);
  if (button === 0 && s.drag === "dragging") {
    if (inDragEnd(point)) { s.drag = "complete"; s.dragCompleted++; log(s, at, "drag-complete", "primary"); }
    else { s.drag = "early-release"; s.dragEarly++; log(s, at, "drag-early-release", "primary", "Released before the end target; may be intentional", "notice"); }
  }
}
export function mouseMove(s: MouseState, buttons: number, point: Point, at: number) {
  s.moves++; s.position = point;
  for (let i = 0; i < s.buttons.length; i++) {
    const b = s.buttons[i];
    if (b.since !== null && !(buttons & BUTTON_BITS[i])) {
      b.since = null; b.lastDown = null; s.missingReleases++;
      log(s, at, "release-not-received", BUTTON_NAMES[i], "Button is no longer held; no mouseup was observed", "suspect");
      if (i === 0 && s.drag === "dragging") s.drag = "interrupted";
    }
  }
  s.trail.push(point); if (s.trail.length > 180) s.trail.shift();
}
export function interruptMouse(s: MouseState, at: number, reason: string) {
  for (const b of s.buttons) { b.since = null; b.lastDown = null; }
  if (s.drag === "dragging") s.drag = "interrupted";
  s.interruptions++; log(s, at, "paused", "mouse", reason, "notice");
}

export type WheelDirection = "free" | "up" | "down" | "left" | "right";
export interface WheelSample { at: number; x: number; y: number; mode: number; opposite: boolean }
export interface WheelState extends SessionLog { events: number; up: number; down: number; left: number; right: number; opposite: number; eligible: number; reversals: number; ignoredZoom: number; zero: number; previousX: number; previousY: number; totals: Record<number, { x: number; y: number; absX: number; absY: number }>; samples: WheelSample[] }
export const createWheelState = (): WheelState => ({ ...freshLog(), events: 0, up: 0, down: 0, left: 0, right: 0, opposite: 0, eligible: 0, reversals: 0, ignoredZoom: 0, zero: 0, previousX: 0, previousY: 0, totals: {}, samples: [] });
export function wheelInput(s: WheelState, x: number, y: number, mode: number, ctrl: boolean, expected: WheelDirection, at: number) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  if (ctrl) { s.ignoredZoom++; log(s, at, "zoom-ignored", "wheel", "Ctrl / pinch input excluded", "notice"); return; }
  if (x === 0 && y === 0) { s.zero++; return; }
  s.events++; if (y < 0) s.up++; if (y > 0) s.down++; if (x < 0) s.left++; if (x > 0) s.right++;
  const sx = Math.sign(x), sy = Math.sign(y);
  if ((sx && s.previousX && sx !== s.previousX) || (sy && s.previousY && sy !== s.previousY)) s.reversals++;
  if (sx) s.previousX = sx; if (sy) s.previousY = sy;
  const vertical = expected === "up" || expected === "down";
  const selectedDelta = vertical ? y : x;
  const expectedSign = expected === "up" || expected === "left" ? -1 : 1;
  const opposite = expected !== "free" && selectedDelta !== 0 && Math.sign(selectedDelta) !== expectedSign;
  if (expected !== "free" && selectedDelta !== 0) s.eligible++;
  if (opposite) s.opposite++;
  const total = s.totals[mode] ?? (s.totals[mode] = { x: 0, y: 0, absX: 0, absY: 0 });
  total.x += x; total.y += y; total.absX += Math.abs(x); total.absY += Math.abs(y);
  s.samples.push({ at, x, y, mode, opposite }); if (s.samples.length > 80) s.samples.shift();
  log(s, at, opposite ? "opposite-direction" : "wheel", "wheel", `x=${x.toFixed(2)}, y=${y.toFixed(2)}, deltaMode=${mode}`, opposite ? "suspect" : "input");
}
export function interruptWheel(s: WheelState, at: number, reason: string) { s.previousX = 0; s.previousY = 0; s.interruptions++; log(s, at, "paused", "wheel", reason, "notice"); }

export function csvLog(entries: InputLog[]) {
  const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  // Text fields are internal codes, not arbitrary spreadsheet formulas.
  return "\uFEFF" + [["time_ms", "event", "target", "detail", "kind"], ...entries.map(e => [e.at.toFixed(1), e.event, e.target, e.detail, e.kind])].map(row => row.map(quote).join(",")).join("\r\n");
}
