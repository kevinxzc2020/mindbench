import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Translations } from "./translations";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 游戏分类。首页/排行榜/stats 都按这个分组展示。
export type GameCategory = "cognitive" | "moba" | "casual";

export const CATEGORY_INFO: Record<
  GameCategory,
  { titleKey: keyof Translations; emoji: string; gradient: string }
> = {
  cognitive: {
    titleKey: "categoryCognitive",
    emoji: "🧠",
    gradient: "from-blue-500 to-indigo-600",
  },
  moba: {
    titleKey: "categoryMoba",
    emoji: "⚔️",
    gradient: "from-yellow-500 to-orange-600",
  },
  casual: {
    titleKey: "categoryCasual",
    emoji: "🍡",
    gradient: "from-pink-500 to-rose-600",
  },
};

export const GAMES = [
  // ═══════════ 认知测试 ═══════════
  {
    id: "reaction-time",
    titleKey: "rtTitle" as const,
    descKey: "rtDesc" as const,
    icon: "⚡",
    color: "from-yellow-400 to-orange-500",
    lowerIsBetter: true,
    category: "cognitive" as const,
  },
  {
    id: "number-memory",
    titleKey: "nmTitle" as const,
    descKey: "nmDesc" as const,
    icon: "🔢",
    color: "from-blue-400 to-blue-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },
  {
    id: "sequence-memory",
    titleKey: "smTitle" as const,
    descKey: "smDesc" as const,
    icon: "🧩",
    color: "from-purple-400 to-purple-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },
  {
    id: "visual-memory",
    titleKey: "vmTitle" as const,
    descKey: "vmDesc" as const,
    icon: "👁️",
    color: "from-green-400 to-emerald-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },
  {
    id: "cps-test",
    titleKey: "cpsTitle" as const,
    descKey: "cpsDesc" as const,
    icon: "🖱️",
    color: "from-rose-400 to-pink-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },
  {
    id: "aim-trainer",
    titleKey: "aimTitle" as const,
    descKey: "aimDesc" as const,
    icon: "🎯",
    color: "from-cyan-400 to-blue-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },
  {
    id: "typing-test",
    titleKey: "typeTitle" as const,
    descKey: "typeDesc" as const,
    icon: "⌨️",
    color: "from-emerald-400 to-teal-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },

  // ═══════════ MOBA 衍生 ═══════════
  {
    id: "last-hit",
    titleKey: "lastHitTitle" as const,
    descKey: "lastHitDesc" as const,
    icon: "🗡️",
    color: "from-yellow-500 to-amber-700",
    lowerIsBetter: false,
    category: "moba" as const,
  },
  {
    id: "skill-shot",
    titleKey: "skillShotTitle" as const,
    descKey: "skillShotDesc" as const,
    icon: "✨",
    color: "from-violet-400 to-indigo-600",
    lowerIsBetter: false,
    category: "moba" as const,
  },
  {
    id: "combo",
    titleKey: "comboTitle" as const,
    descKey: "comboDesc" as const,
    icon: "⚡",
    color: "from-pink-500 to-red-600",
    lowerIsBetter: false,
    category: "moba" as const,
  },

  // ═══════════ 休闲小游戏 ═══════════
  {
    id: "tile-match",
    titleKey: "tmTitle" as const,
    descKey: "tmDesc" as const,
    icon: "🎴",
    color: "from-fuchsia-500 to-purple-700",
    lowerIsBetter: false,
    category: "casual" as const,
  },
  {
    id: "goose-grab",
    titleKey: "ggTitle" as const,
    descKey: "ggDesc" as const,
    icon: "🦢",
    color: "from-orange-500 to-red-600",
    lowerIsBetter: false,
    category: "casual" as const,
  },
  {
    id: "black-hole",
    titleKey: "bhTitle" as const,
    descKey: "bhDesc" as const,
    icon: "🕳️",
    color: "from-slate-700 to-black",
    lowerIsBetter: false,
    category: "casual" as const,
  },
  {
    id: "sheep",
    titleKey: "sheepTitle" as const,
    descKey: "sheepDesc" as const,
    icon: "🐰",
    color: "from-pink-400 to-rose-500",
    lowerIsBetter: false,
    category: "casual" as const,
  },
] as const;

export type GameId = (typeof GAMES)[number]["id"];

// 按 category 分组（用于首页 / stats / leaderboard 的分区展示）
export function getGamesByCategory(): Record<
  GameCategory,
  typeof GAMES[number][]
> {
  const groups: Record<GameCategory, typeof GAMES[number][]> = {
    cognitive: [],
    moba: [],
    casual: [],
  };
  for (const g of GAMES) {
    groups[g.category].push(g);
  }
  return groups;
}

export function formatScore(gameId: GameId, value: number, t: Translations): string {
  if (gameId === "reaction-time") return `${Math.round(value)} ms`;
  if (gameId === "cps-test") return `${value.toFixed(1)} CPS`;
  if (gameId === "aim-trainer") return `${Math.round(value)} ${t.aimHitsUnit}`;
  if (gameId === "typing-test") return `${Math.round(value)} WPM`;
  if (gameId === "last-hit") return `${Math.round(value)} ${t.lastHitHits}`;
  if (gameId === "skill-shot") return `${Math.round(value)} ${t.skillShotHits}`;
  if (gameId === "combo") return `${t.comboLevel} ${Math.round(value)}`;
  if (gameId === "tile-match") return `${t.level} ${Math.round(value)}`;
  if (gameId === "goose-grab") return `${t.level} ${Math.round(value)}`;
  if (gameId === "black-hole") return `${Math.round(value)} ${t.bhMassUnit}`;
  return `${t.level} ${Math.round(value)}`;
}
