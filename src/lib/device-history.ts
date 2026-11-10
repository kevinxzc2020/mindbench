import type { DiagnosticTool } from "./device-diagnostics";

export const HISTORY_KEY = "mindbench-device-history-v1";
export const HISTORY_LIMIT = 100;
export const REPORT_TOOLS = ["keyboard", "mouse", "wheel", "screen", "speakers", "microphone", "webcam", "gamepad", "touch", "pen", "trackpad", "environment"] as const;
export type ReportTool = typeof REPORT_TOOLS[number];
export type ObservationResult = "unsure" | "clear" | "review";
export interface CheckMetric { key: string; label: [string, string, string]; value: number | string | boolean | null; unit?: string }
export interface CheckupRecord { id: string; tool: ReportTool; at: string; name: string; note: string; result: ObservationResult; metrics: CheckMetric[] }
export interface CheckupSnapshot { tool: DiagnosticTool; metrics: CheckMetric[] }
export const metric = (key: string, label: CheckMetric["label"], value: CheckMetric["value"], unit?: string): CheckMetric => ({ key, label, value, ...(unit ? { unit } : {}) });
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const short = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;

/** Only bounded summaries are accepted; recordings, images and raw events have no schema field. */
export function validateRecord(value: unknown): CheckupRecord {
  if (!object(value) || !short(value.id, 100) || !value.id || !REPORT_TOOLS.includes(value.tool as ReportTool)
    || !short(value.at, 40) || !Number.isFinite(Date.parse(value.at)) || !short(value.name, 80) || !short(value.note, 500)
    || !["unsure", "clear", "review"].includes(value.result as string) || !Array.isArray(value.metrics) || value.metrics.length > 40) throw new Error("Invalid checkup record");
  const seen = new Set<string>();
  const metrics = value.metrics.map((item: unknown): CheckMetric => {
    if (!object(item) || !short(item.key, 60) || !item.key || seen.has(item.key) || !Array.isArray(item.label) || item.label.length !== 3
      || !item.label.every(label => short(label, 100)) || !(item.value === null || typeof item.value === "boolean" || short(item.value, 200) || typeof item.value === "number" && Number.isFinite(item.value))
      || !(item.unit === undefined || short(item.unit, 30))) throw new Error("Invalid checkup metric");
    seen.add(item.key);
    return { key: item.key, label: item.label as CheckMetric["label"], value: item.value as CheckMetric["value"], ...(item.unit ? { unit: item.unit as string } : {}) };
  });
  return { id: value.id, tool: value.tool as ReportTool, at: value.at, name: value.name, note: value.note, result: value.result as ObservationResult, metrics };
}
export function parseHistory(raw: string): CheckupRecord[] {
  if (raw.length > 1_000_000) throw new Error("Report is too large");
  const data: unknown = JSON.parse(raw);
  if (!object(data) || data.kind !== "mindbench-device-history" || data.version !== 1 || !Array.isArray(data.records) || data.records.length > HISTORY_LIMIT) throw new Error("Unsupported report format");
  const records = data.records.map(validateRecord);
  if (new Set(records.map(r => r.id)).size !== records.length) throw new Error("Duplicate report identifiers");
  return records;
}
export const serializeHistory = (records: CheckupRecord[]) => JSON.stringify({ kind: "mindbench-device-history", version: 1, records: records.map(validateRecord) }, null, 2);
export function mergeHistory(existing: CheckupRecord[], incoming: CheckupRecord[]) {
  const map = new Map(existing.map(record => [record.id, record]));
  incoming.forEach(record => { if (!map.has(record.id)) map.set(record.id, validateRecord(record)); });
  return Array.from(map.values()).sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, HISTORY_LIMIT);
}
export function readHistory(): CheckupRecord[] { const raw = localStorage.getItem(HISTORY_KEY); return raw ? parseHistory(raw) : []; }
export function writeHistory(records: CheckupRecord[]) { localStorage.setItem(HISTORY_KEY, serializeHistory(records.slice(0, HISTORY_LIMIT))); window.dispatchEvent(new Event("mindbench-history")); }
export function compareRecords(a: CheckupRecord, b: CheckupRecord) {
  if (a.tool !== b.tool) throw new Error("Choose the same tool");
  const keys = Array.from(new Set([...a.metrics.map(m => m.key), ...b.metrics.map(m => m.key)]));
  return keys.map(key => {
    const left = a.metrics.find(m => m.key === key), right = b.metrics.find(m => m.key === key);
    const delta = left?.unit === right?.unit && typeof left?.value === "number" && typeof right?.value === "number" ? right.value - left.value : null;
    return { key, label: (right ?? left)!.label, left, right, delta };
  });
}
export function downloadCheckups(records: CheckupRecord[]) {
  const url = URL.createObjectURL(new Blob([serializeHistory(records)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = `mindbench-checkups-${new Date().toISOString().replace(/[:.]/g, "-")}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
