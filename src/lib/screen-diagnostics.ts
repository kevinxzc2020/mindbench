/** Generated test patterns and observations. None of these functions reads physical panel output. */
export type ScreenMode = "solid" | "gradient" | "motion";
export type GradientPreset = "gray" | "rgb" | "spectrum" | "dark" | "light";
export type RGB = [number, number, number];
export const SOLID_COLORS = ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#00ffff", "#ff00ff", "#ffff00", "#808080"] as const;
export const MARK_LIMIT = 200;
export const OBSERVATION_LIMIT = 100;
export const FRAME_WINDOW = 240;
export function screenMode(value: string | null): ScreenMode { return value === "gradient" || value === "motion" ? value : "solid"; }
export function cycleIndex(index: number, delta: number, length: number) { return length > 0 ? ((index + delta) % length + length) % length : 0; }
export function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
export function snakeCell(index: number, columns: number, rows: number) {
  const safe = clamp(Math.floor(index), 0, columns * rows - 1);
  const row = Math.floor(safe / columns);
  return { row, column: row % 2 ? columns - 1 - safe % columns : safe % columns };
}
export function steppedPosition(position: number, steps: number | null) {
  const p = clamp(position, 0, 1);
  return steps === null ? p : Math.min(steps - 1, Math.floor(p * steps)) / (steps - 1);
}
export function gradientRGB(preset: GradientPreset, position: number, band = 0): RGB {
  const p = clamp(position, 0, 1);
  const value = Math.round(p * 255);
  if (preset === "rgb") return band === 0 ? [value, 0, 0] : band === 1 ? [0, value, 0] : [0, 0, value];
  if (preset === "spectrum") {
    const h = p * 6, segment = Math.min(5, Math.floor(h));
    const up = Math.round((h - segment) * 255), down = 255 - up;
    return [[255, up, 0], [down, 255, 0], [0, 255, up], [0, down, 255], [up, 0, 255], [255, 0, down]][segment] as RGB;
  }
  const gray = preset === "dark" ? Math.round(p * 32) : preset === "light" ? Math.round(223 + p * 32) : value;
  return [gray, gray, gray];
}
export function canvasBackingSize(width: number, height: number, dpr: number) {
  const w = Math.max(1, width), h = Math.max(1, height), ratio = Math.max(1, dpr || 1);
  // Bound allocation on very large/multi-screen canvases; the UI reports the actual buffer size.
  const scale = Math.min(ratio, 8192 / w, 8192 / h, Math.sqrt(16777216 / (w * h)));
  return { width: Math.max(1, Math.floor(w * scale)), height: Math.max(1, Math.floor(h * scale)), scale, limited: scale < ratio - .001 };
}
export function movingTargetX(elapsedMs: number, speed: number, width: number, size: number, direction: "left" | "right") {
  const travel = width + size;
  const phase = ((Math.max(0, elapsedMs) / 1000 * speed) % travel + travel) % travel;
  return direction === "right" ? phase - size : width - phase;
}
export function frameSummary(samples: readonly number[]) {
  const intervals = samples.filter(n => Number.isFinite(n) && n > 0).slice(-FRAME_WINDOW);
  if (!intervals.length) return null;
  const sorted = [...intervals].sort((a, b) => a - b);
  const median = sorted.length % 2 ? sorted[Math.floor(sorted.length / 2)] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const sum = intervals.reduce((a, b) => a + b, 0);
  return { count: intervals.length, elapsedMs: sum, callbackRate: 1000 * intervals.length / sum, medianMs: median, p95Ms: sorted[Math.ceil(sorted.length * .95) - 1], maxMs: sorted[sorted.length - 1], longerIntervals: intervals.filter(n => n > median * 1.5).length, longerThresholdMs: median * 1.5 };
}
export interface ScreenGeometry { width: number; height: number; left: number; top: number; dpr: number; screenX: number; screenY: number; screenWidth: number; screenHeight: number; presentation: "preview" | "fullscreen" | "expanded" }
export function geometryKey(g: ScreenGeometry) { return [g.width, g.height, g.left, g.top, g.dpr, g.screenX, g.screenY, g.screenWidth, g.screenHeight, g.presentation].join("|"); }
export function markerPosition(clientX: number, clientY: number, geometry: ScreenGeometry) {
  return { x: clamp(clientX - geometry.left, 0, geometry.width), y: clamp(clientY - geometry.top, 0, geometry.height), relativeX: clamp((clientX - geometry.left) / Math.max(1, geometry.width), 0, 1), relativeY: clamp((clientY - geometry.top) / Math.max(1, geometry.height), 0, 1) };
}
export type MarkKind = "bright" | "dark" | "color" | "other";
export interface ScreenMark extends ReturnType<typeof markerPosition> { id: number; kind: MarkKind; color: string; createdAt: string; geometry: ScreenGeometry; space: string }
export function makeScreenMark(id: number, x: number, y: number, geometry: ScreenGeometry, color: string, kind: MarkKind, createdAt: string): ScreenMark {
  return { id, ...markerPosition(x, y, geometry), kind, color, createdAt, geometry: { ...geometry }, space: geometryKey(geometry) };
}
export function observationCSV(rows: Array<Array<string | number>>) {
  const cell = (value: string | number) => {
    let text = String(value);
    // User-authored notes must never become spreadsheet formulas.
    if (typeof value === "string" && /^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n");
}
