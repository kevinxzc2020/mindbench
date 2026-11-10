export interface TracePoint { x: number; y: number; pressure: number }
export function normalizePoint(x: number, y: number, width: number, height: number): TracePoint | null {
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0 || x < 0 || y < 0 || x > width || y > height) return null;
  return { x: x / width, y: y / height, pressure: 0 };
}
export function coverageCell(x: number, y: number, columns = 8, rows = 6) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1 || !Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1) return -1;
  return Math.min(rows - 1, Math.floor(y * rows)) * columns + Math.min(columns - 1, Math.floor(x * columns));
}
export const isEdgeCell = (cell: number, columns = 8, rows = 6) => cell >= 0 && cell < columns * rows && (cell < columns || cell >= columns * (rows - 1) || cell % columns === 0 || cell % columns === columns - 1);
export interface PadSample { axes: readonly number[]; buttons: readonly { value: number; pressed: boolean }[] }
export interface PadStats { samples: number; min: number[]; max: number[]; pressed: number[]; lastButtons: boolean[] }
export const freshPadStats = (): PadStats => ({ samples: 0, min: [], max: [], pressed: [], lastButtons: [] });
export function observePad(stats: PadStats, sample: PadSample) {
  stats.samples++;
  sample.axes.forEach((value, index) => { if (Number.isFinite(value)) { stats.min[index] = Math.min(stats.min[index] ?? value, value); stats.max[index] = Math.max(stats.max[index] ?? value, value); } });
  sample.buttons.forEach((button, index) => { if (button.pressed && !stats.lastButtons[index]) stats.pressed[index] = (stats.pressed[index] ?? 0) + 1; stats.lastButtons[index] = button.pressed; });
}
export interface RestSummary { samples: number; mean: number[]; maxDeviation: number[] }
/** Raw browser axes; a guided hands-off sample is a measurement, not a drift verdict. */
export function summarizeRest(samples: readonly (readonly number[])[]): RestSummary | null {
  if (!samples.length) return null;
  const count = samples[0].length;
  if (!count || samples.some(row => row.length !== count || row.some(v => !Number.isFinite(v)))) return null;
  const mean = Array.from({ length: count }, (_, i) => samples.reduce((sum, row) => sum + row[i], 0) / samples.length);
  const maxDeviation = mean.map((avg, i) => Math.max(...samples.map(row => Math.abs(row[i] - avg))));
  return { samples: samples.length, mean, maxDeviation };
}

export type PointerTool = "touch" | "pen" | "trackpad";
export interface PointerSample extends TracePoint { id: number; type: string; tiltX: number; tiltY: number; twist: number; buttons: number; width: number; height: number }
export interface TraceStroke { id: number; points: TracePoint[] }
export interface PointerStats {
  received: number; downs: number; completed: number; canceled: number; interruptions: number; maxContacts: number;
  ignored: number; contacts: Map<number, PointerSample>; strokes: TraceStroke[]; cells: Set<number>;
  last: PointerSample | null; pressureMin: number | null; pressureMax: number | null; tiltMin: number | null; tiltMax: number | null;
}
export const freshPointerStats = (): PointerStats => ({ received: 0, downs: 0, completed: 0, canceled: 0, interruptions: 0, maxContacts: 0, ignored: 0, contacts: new Map(), strokes: [], cells: new Set(), last: null, pressureMin: null, pressureMax: null, tiltMin: null, tiltMax: null });
export function acceptsPointer(tool: PointerTool, type: string) { return type === (tool === "touch" ? "touch" : tool === "pen" ? "pen" : "mouse"); }
export function pointerSample(stats: PointerStats, tool: PointerTool, phase: "down" | "move" | "up" | "cancel", sample: PointerSample) {
  if (!acceptsPointer(tool, sample.type)) { stats.ignored++; return; }
  if (![sample.x, sample.y, sample.pressure, sample.tiltX, sample.tiltY].every(Number.isFinite)) return;
  if (phase === "cancel" || phase === "up") {
    if (stats.contacts.delete(sample.id)) { if (phase === "cancel") stats.canceled++; else stats.completed++; }
    stats.last = sample; return;
  }
  if (phase === "down") {
    if (stats.contacts.has(sample.id)) return;
    stats.downs++; stats.contacts.set(sample.id, sample); stats.strokes.push({ id: sample.id, points: [] });
    if (stats.strokes.length > 32) stats.strokes.splice(0, stats.strokes.length - 32);
    stats.maxContacts = Math.max(stats.maxContacts, stats.contacts.size);
  }
  stats.last = sample;
  if (!stats.contacts.has(sample.id)) return; // Hover is shown but does not count as contact coverage or pressure.
  stats.received++; stats.contacts.set(sample.id, sample);
  const cell = coverageCell(sample.x, sample.y); if (cell >= 0) stats.cells.add(cell);
  const stroke = stats.strokes.slice().reverse().find(s => s.id === sample.id);
  if (stroke && cell >= 0) { stroke.points.push(sample); if (stroke.points.length > 320) stroke.points.splice(0, stroke.points.length - 320); }
  const pressure = Math.max(0, Math.min(1, sample.pressure));
  stats.pressureMin = Math.min(stats.pressureMin ?? pressure, pressure); stats.pressureMax = Math.max(stats.pressureMax ?? pressure, pressure);
  const tilt = Math.hypot(sample.tiltX, sample.tiltY);
  stats.tiltMin = Math.min(stats.tiltMin ?? tilt, tilt); stats.tiltMax = Math.max(stats.tiltMax ?? tilt, tilt);
}
export function interruptPointers(stats: PointerStats) { if (stats.contacts.size) stats.interruptions++; stats.contacts.clear(); }
