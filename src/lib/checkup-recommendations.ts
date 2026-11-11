import { CATALOG } from "./collections";
import type { ReportTool } from "./device-history";

type Plan = { tests: string[]; game: string; next: ReportTool };
export const CHECKUP_NEXT: Record<ReportTool, Plan> = {
  keyboard: { tests: ["typing-test", "sequence-memory"], game: "arrow", next: "mouse" },
  mouse: { tests: ["cps-test", "aim-trainer"], game: "screw", next: "wheel" },
  wheel: { tests: ["cps-test", "reaction-time"], game: "fruit", next: "mouse" },
  trackpad: { tests: ["reaction-time", "sequence-memory"], game: "screw", next: "mouse" },
  screen: { tests: ["visual-memory", "sequence-memory"], game: "beads", next: "environment" },
  speakers: { tests: ["verbal-memory", "number-memory"], game: "make-seven", next: "microphone" },
  microphone: { tests: ["verbal-memory", "number-memory"], game: "make-seven", next: "speakers" },
  webcam: { tests: ["visual-memory", "sequence-memory"], game: "beads", next: "microphone" },
  gamepad: { tests: ["reaction-time", "aim-trainer"], game: "arrow", next: "keyboard" },
  touch: { tests: ["reaction-time", "visual-memory"], game: "fruit", next: "screen" },
  pen: { tests: ["visual-memory", "sequence-memory"], game: "beads", next: "touch" },
  environment: { tests: ["reaction-time", "number-memory"], game: "make-seven", next: "keyboard" },
};

export function checkupRecommendations(tool: ReportTool) {
  const plan = CHECKUP_NEXT[tool];
  return [
    ...plan.tests.map(id => ({ entry: CATALOG.mind.find(e => e.id === id), kind: "test" as const })),
    { entry: CATALOG.discover.find(e => e.id === plan.game), kind: "game" as const },
  ].flatMap(({ entry, kind }) => entry?.href ? [{ entry, kind }] : []);
}
