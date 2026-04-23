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
] as const;

export type GameId = (typeof GAMES)[number]["id"];

export function formatScore(gameId: GameId, value: number, t: Translations): string {
  if (gameId === "reaction-time") return `${Math.round(value)} ms`;
  return `${t.level} ${Math.round(value)}`;
}
