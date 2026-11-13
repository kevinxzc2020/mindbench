/** Estimates from browser event timing and pointer-lock deltas. Neither is a hardware certification. */
export const STANDARD_RATES = [125, 250, 500, 1000, 2000, 4000, 8000] as const;
/** Gaps longer than this mean the mouse paused; they are not polling intervals. */
export const MOTION_GAP_MS = 50;

export interface PollingSummary { intervals: number; medianHz: number; steadyShare: number; nearest: number }
export function pollingSummary(timestamps: readonly number[]): PollingSummary | null {
  const times = Array.from(new Set(timestamps)).sort((a, b) => a - b);
  const intervals: number[] = [];
  for (let i = 1; i < times.length; i++) { const gap = times[i] - times[i - 1]; if (gap > 0 && gap < MOTION_GAP_MS) intervals.push(gap); }
  if (intervals.length < 50) return null;
  const sorted = [...intervals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const medianHz = 1000 / median;
  const steadyShare = intervals.filter(g => Math.abs(g - median) <= median * 0.25).length / intervals.length;
  return { intervals: intervals.length, medianHz, steadyShare, nearest: nearestRate(medianHz) };
}
export function nearestRate(hz: number) {
  return STANDARD_RATES.reduce((best, rate) => Math.abs(Math.log(rate / hz)) < Math.abs(Math.log(best / hz)) ? rate : best, STANDARD_RATES[0] as number);
}
export type DistanceUnit = "cm" | "in";
export function dpiFromCounts(counts: number, distance: number, unit: DistanceUnit) {
  const inches = unit === "cm" ? distance / 2.54 : distance;
  return inches > 0 && Number.isFinite(counts) ? Math.abs(counts) / inches : null;
}
