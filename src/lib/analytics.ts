import { REPORT_TOOLS, type ReportTool } from "./device-history";
import type { Difficulty } from "./difficulty";
import { isLocalAdPreview } from "./adsense";
import { langOfPath, localizePath, stripLangPrefix } from "./i18n";
import { getConverter, type ConverterId } from "./converters";

export function getAnalyticsId() {
  const id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() ?? "";
  return /^G-[A-Z0-9]+$/.test(id) ? id : null;
}
export function analyticsEnabled(id: string | null, consent: boolean, hostname: string) {
  return Boolean(id && /^G-[A-Z0-9]+$/.test(id) && consent && !isLocalAdPreview(hostname));
}

export type JourneyEvent =
  | { name: "tool_open" | "tool_start" | "tool_complete"; tool: ReportTool }
  | { name: "recommendation_click"; tool: ReportTool; target: string; kind: "test" | "game" | "tool" | "resource" };

/** Only catalogue identifiers leave the browser; never accept samples, labels or free text. */
export function analyticsPayload(event: JourneyEvent) {
  if (!REPORT_TOOLS.includes(event.tool)) return null;
  if (!["tool_open", "tool_start", "tool_complete", "recommendation_click"].includes(event.name)) return null;
  const params: Record<string, string> = { tool_id: event.tool };
  if (event.name === "recommendation_click") {
    if (!/^[a-z0-9-]{1,60}$/.test(event.target) || !["test", "game", "tool", "resource"].includes(event.kind)) return null;
    params.content_id = event.target;
    params.content_type = event.kind;
    params.placement = "checkup_complete";
  }
  return { name: event.name, params };
}

// Do not retain or replay interactions collected before consent.
let send: ((name: string, params: Record<string, string>) => void) | null = null;
export function setAnalyticsSender(sender: typeof send) { send = sender; }
export function trackJourney(event: JourneyEvent) {
  const payload = analyticsPayload(event);
  if (!payload || !send) return false;
  send(payload.name, payload.params);
  return true;
}

/** The game funnel: a game page opened, a run started, a run produced a score, and a click on the shelf shown under a score. */
export type GameEvent =
  | { name: "game_open"; game: string }
  | { name: "game_start" | "game_complete"; game: string; difficulty: Difficulty }
  | { name: "recommendation_click"; game: string; target: string; kind: "test" | "game" };

const CATALOGUE_ID = /^[a-z0-9-]{1,60}$/;
// Kept here, not imported, so the analytics module stays out of the game configuration; a test keeps the two lists equal.
const DIFFICULTY_LABELS = ["easy", "medium", "hard", "hell"];

/** Only catalogue identifiers and the difficulty label leave the browser: never a score, an answer, typed text or a timing. */
export function gamePayload(event: GameEvent) {
  if (!CATALOGUE_ID.test(event.game)) return null;
  const params: Record<string, string> = { game_id: event.game };
  if (event.name === "game_open") return { name: event.name, params };
  if (event.name === "recommendation_click") {
    if (!CATALOGUE_ID.test(event.target) || !["test", "game"].includes(event.kind)) return null;
    return { name: event.name, params: { ...params, content_id: event.target, content_type: event.kind, placement: "game_result" } };
  }
  if (event.name !== "game_start" && event.name !== "game_complete") return null;
  if (!DIFFICULTY_LABELS.includes(event.difficulty)) return null;
  return { name: event.name, params: { ...params, difficulty: event.difficulty } };
}
export function trackGame(event: GameEvent) {
  const payload = gamePayload(event);
  if (!payload || !send) return false;
  send(payload.name, payload.params);
  return true;
}

/** No filenames, content, document properties or output URLs are analytics fields. */
export function trackConversion(name: "conversion_start" | "conversion_complete" | "conversion_download", converter: ConverterId) {
  if (!send || !getConverter(converter) || !["conversion_start", "conversion_complete", "conversion_download"].includes(name)) return false;
  send(name, { converter_id: converter });
  return true;
}

/** Query strings, fragments and private/dynamic paths are not analytics dimensions. */
export function analyticsPath(pathname: string) {
  const full = pathname.split(/[?#]/)[0];
  const lang = langOfPath(full);
  const path = stripLangPrefix(full);
  // The language stays in the reported path (`/zh/tools/keyboard`) so reports can split by language.
  if (path === "/convert" || (path.startsWith("/convert/") && getConverter(path.slice("/convert/".length)))) return localizePath(lang, path);
  if (/^\/(?:$|tools\/[a-z-]+$|collections(?:\/[a-z-]+)?$|games\/(?:minigames\/)?[a-z0-9-]+$|drivers(?:\/[a-z0-9-]+){0,2}$|(?:mbti|iq-test|tarot|daily|progress|leaderboard|privacy|cookies|terms|about|contact|rights)$)/.test(path)) return localizePath(lang, path);
  return "/other";
}

export function analyticsReferrer(value: string) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.origin : ""; } catch { return ""; }
}
