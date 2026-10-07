export interface Attempt { game: string; difficulty: string; value: number; at: string; device: string }
const KEY = "mindbench-progress-v1";
export function readAttempts(): Attempt[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(data) ? data.filter((a): a is Attempt => a && typeof a.game === "string" && typeof a.difficulty === "string" && Number.isFinite(a.value) && typeof a.at === "string" && typeof a.device === "string").slice(-500) : [];
  } catch { return []; }
}
export function recordAttempt(attempt: Attempt): boolean {
  try { localStorage.setItem(KEY, JSON.stringify([...readAttempts(), attempt].slice(-500))); return true; } catch { return false; }
}
