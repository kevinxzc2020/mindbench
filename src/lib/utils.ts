import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Translations } from "./translations";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GAMES = [
  {
    id: "reaction-time",
    titleKey: "rtTitle" as const,
    descKey: "rtDesc" as const,
    icon: "⚡",
    color: "from-yellow-400 to-orange-500",
    lowerIsBetter: true,
  },
  {
    id: "number-memory",
    titleKey: "nmTitle" as const,
    descKey: "nmDesc" as const,
    icon: "🔢",
    color: "from-blue-400 to-blue-600",
    lowerIsBetter: false,
  },
  {
    id: "sequence-memory",
    titleKey: "smTitle" as const,
    descKey: "smDesc" as const,
    icon: "🧩",
    color: "from-purple-400 to-purple-600",
    lowerIsBetter: false,
  },
  {
    id: "visual-memory",
    titleKey: "vmTitle" as const,
    descKey: "vmDesc" as const,
    icon: "👁️",
    color: "from-green-400 to-emerald-600",
    lowerIsBetter: false,
  },
  {
    id: "cps-test",
    titleKey: "cpsTitle" as const,
    descKey: "cpsDesc" as const,
    icon: "🖱️",
    color: "from-rose-400 to-pink-600",
    lowerIsBetter: false,
  },
  {
    id: "aim-trainer",
    titleKey: "aimTitle" as const,
    descKey: "aimDesc" as const,
    icon: "🎯",
    color: "from-cyan-400 to-blue-600",
    lowerIsBetter: false,
  },
  {
    id: "typing-test",
    titleKey: "typeTitle" as const,
    descKey: "typeDesc" as const,
    icon: "⌨️",
    color: "from-emerald-400 to-teal-600",
    lowerIsBetter: false,
  },
  {
    id: "last-hit",
    titleKey: "lastHitTitle" as const,
    descKey: "lastHitDesc" as const,
    icon: "🗡️",
    color: "from-yellow-500 to-amber-700",
    lowerIsBetter: false,
  },
  {
    id: "skill-shot",
    titleKey: "skillShotTitle" as const,
    descKey: "skillShotDesc" as const,
    icon: "✨",
    color: "from-violet-400 to-indigo-600",
    lowerIsBetter: false,
  },
  {
    id: "combo",
    titleKey: "comboTitle" as const,
    descKey: "comboDesc" as const,
    icon: "⚡",
    color: "from-pink-500 to-red-600",
    lowerIsBetter: false,
  },
] as const;

export type GameId = (typeof GAMES)[number]["id"];

export function formatScore(gameId: GameId, value: number, t: Translations): string {
  if (gameId === "reaction-time") return `${Math.round(value)} ms`;
  if (gameId === "cps-test") return `${value.toFixed(1)} CPS`;
  if (gameId === "aim-trainer") return `${Math.round(value)} ${t.aimHitsUnit}`;
  if (gameId === "typing-test") return `${Math.round(value)} WPM`;
  if (gameId === "last-hit") return `${Math.round(value)} ${t.lastHitHits}`;
  if (gameId === "skill-shot") return `${Math.round(value)} ${t.skillShotHits}`;
  if (gameId === "combo") return `${t.comboLevel} ${Math.round(value)}`;
  return `${t.level} ${Math.round(value)}`;
}
