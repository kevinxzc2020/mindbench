import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Translations } from "./translations";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 把页面滚动到当前游戏的 3D / 主操作区。
 *
 * GameWrapper 在选难度 / 换难度时会自动调用（通过 ref + useEffect），
 * 但如果某个游戏内部有 "重新开始" / "下一关" 按钮想触发滚动，
 * 直接 import 这个函数调用即可：
 *
 *   import { scrollToGameArea } from "@/lib/utils";
 *   <button onClick={() => { restart(); scrollToGameArea(); }} />
 *
 * 锚点：GameWrapper 渲染游戏区的 div 上有 id="mb-game-area"。
 */
export function scrollToGameArea(): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById("mb-game-area");
  if (!el) return;
  // block: "center" 让游戏区居中对齐到视口中央
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

// 游戏分类。首页/排行榜/stats 都按这个分组展示。
export type GameCategory = "cognitive" | "moba" | "casual";

export const CATEGORY_INFO: Record<
  GameCategory,
  { titleKey: keyof Translations; gradient: string }
> = {
  cognitive: {
    titleKey: "categoryCognitive",
    gradient: "from-blue-500 to-indigo-600",
  },
  moba: {
    titleKey: "categoryMoba",
    gradient: "from-yellow-500 to-orange-600",
  },
  casual: {
    titleKey: "categoryCasual",
    gradient: "from-pink-500 to-rose-600",
  },
};

/**
 * 每个分类的 CTA 文案 key —— 不要全部叫"Start Test"，
 * 认知测试叫 Take test、MOBA 叫 Train、休闲叫 Play，更贴合体验。
 */
export function categoryCta(cat: GameCategory): keyof Translations {
  if (cat === "moba") return "ctaTrain";
  if (cat === "casual") return "ctaPlay";
  return "ctaTakeTest";
}

// 注意：每个游戏的可视化图标在 `lib/icons.tsx` 的 `GAME_ICONS` 里（lucide-react）。
// 这里只放数据相关的字段（id / 标题 key / 计分方向 / 卡片渐变 / 分类）。
export const GAMES = [
  // ═══════════ 认知测试 ═══════════
  {
    id: "reaction-time",
    titleKey: "rtTitle" as const,
    descKey: "rtDesc" as const,
    color: "from-yellow-400 to-orange-500",
    lowerIsBetter: true,
    category: "cognitive" as const,
  },
  {
    id: "number-memory",
    titleKey: "nmTitle" as const,
    descKey: "nmDesc" as const,
    color: "from-blue-400 to-blue-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },
  {
    id: "sequence-memory",
    titleKey: "smTitle" as const,
    descKey: "smDesc" as const,
    color: "from-purple-400 to-purple-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },
  {
    id: "visual-memory",
    titleKey: "vmTitle" as const,
    descKey: "vmDesc" as const,
    color: "from-green-400 to-emerald-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },
  {
    id: "cps-test",
    titleKey: "cpsTitle" as const,
    descKey: "cpsDesc" as const,
    color: "from-rose-400 to-pink-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },
  {
    id: "aim-trainer",
    titleKey: "aimTitle" as const,
    descKey: "aimDesc" as const,
    color: "from-cyan-400 to-blue-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },
  {
    id: "typing-test",
    titleKey: "typeTitle" as const,
    descKey: "typeDesc" as const,
    color: "from-emerald-400 to-teal-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },

  {
    id: "verbal-memory",
    titleKey: "verbalMemoryTitle" as const,
    descKey: "verbalMemoryDesc" as const,
    color: "from-blue-400 to-indigo-600",
    lowerIsBetter: false,
    category: "cognitive" as const,
  },

  // ═══════════ 休闲小游戏 ═══════════
  {
    id: "goose-grab",
    titleKey: "ggTitle" as const,
    descKey: "ggDesc" as const,
    color: "from-orange-500 to-red-600",
    lowerIsBetter: false,
    category: "casual" as const,
  },
  {
    id: "black-hole",
    titleKey: "bhTitle" as const,
    descKey: "bhDesc" as const,
    color: "from-slate-700 to-black",
    lowerIsBetter: false,
    category: "casual" as const,
  },
  {
    id: "sheep",
    titleKey: "sheepTitle" as const,
    descKey: "sheepDesc" as const,
    color: "from-pink-400 to-rose-500",
    lowerIsBetter: false,
    category: "casual" as const,
  },
  {
    id: "skillshot-dodge",
    titleKey: "skillshotDodgeTitle" as const,
    descKey: "skillshotDodgeDesc" as const,
    color: "from-orange-500 to-red-600",
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

  if (gameId === "goose-grab") return `${t.level} ${Math.round(value)}`;
  if (gameId === "black-hole") return `${Math.round(value)} ${t.bhMassUnit}`;
  if (gameId === "skillshot-dodge") return `${Math.round(value)}s`;
  if (gameId === "verbal-memory") return `${Math.round(value)} ${t.verbalMemoryWords}`;
  return `${t.level} ${Math.round(value)}`;
}
