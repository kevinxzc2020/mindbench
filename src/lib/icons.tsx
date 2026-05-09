/**
 * 全站 icon 注册表（lucide-react）。
 *
 * 想法：
 * 1. 单一来源 —— 任何地方需要某个游戏 / 难度 / 分类的 icon，都从这里取，
 *    避免散落在 utils.ts / page.tsx / GameWrapper 里的 emoji 字符串。
 * 2. lucide 的图标都是 React 组件 (LucideIcon 类型)，可以直接 `<Icon size={...} />`
 * 3. 同时提供一个 helper `<GameIcon gameId="..." />` 用于不知道 id 时的兜底。
 */
import {
  Zap, Hash, Layers, Eye, MousePointerClick, Target, Keyboard,
  Flame, Bird, Aperture, Rabbit, BookOpen,
  Grid3X3, Sigma, Link2, Puzzle,
  Brain, Swords, Gamepad2, Moon, Users, Sparkles,
  Sprout, Activity, Skull,
  Trophy, Medal, Award,
  // MBTI 16 type icons
  Castle, FlaskConical, Crown, Lightbulb,
  Compass, Feather, Megaphone, Sun,
  ClipboardCheck, Shield, Briefcase, HeartHandshake,
  Wrench, Palette, Rocket, PartyPopper,
  type LucideIcon,
} from "lucide-react";
import type { GameId, GameCategory } from "./utils";
import type { Difficulty } from "./difficulty";

// ─── 游戏图标 ───────────────────────────────────────────────────────────────
export const GAME_ICONS: Record<GameId, LucideIcon> = {
  // 认知
  "reaction-time":   Zap,
  "number-memory":   Hash,
  "sequence-memory": Layers,
  "visual-memory":   Eye,
  "cps-test":        MousePointerClick,
  "aim-trainer":     Target,
  "typing-test":     Keyboard,
  "verbal-memory":   BookOpen,
  // 益智
  "make-seven":   Grid3X3,
  "beat-number":  Sigma,
  "number-chain": Link2,
  // 休闲
  "goose-grab":      Bird,
  "black-hole":      Aperture,
  "sheep":           Rabbit,
  "skillshot-dodge": Flame,
};

// ─── 分类图标 ───────────────────────────────────────────────────────────────
export const CATEGORY_ICONS: Record<GameCategory, LucideIcon> = {
  cognitive: Brain,
  moba:      Swords,
  casual:    Gamepad2,
  puzzle:    Puzzle,
};

// ─── 难度图标 ───────────────────────────────────────────────────────────────
export const DIFFICULTY_LUCIDE_ICONS: Record<Difficulty, LucideIcon> = {
  easy:   Sprout,
  medium: Activity,
  hard:   Flame,
  hell:   Skull,
};

// ─── 性格 & 玄学 ───────────────────────────────────────────────────────────
export const MystIcons = {
  Header: Moon,
  Mbti:   Users,
  Tarot:  Sparkles,
};

// ─── 排行榜奖牌 ─────────────────────────────────────────────────────────────
/** 给定排名（1/2/3），返回奖牌图标和金/银/铜 Tailwind 渐变 */
export function rankMedal(rank: number): {
  Icon: LucideIcon;
  gradient: string;
  text: string;
} | null {
  if (rank === 1) return { Icon: Trophy, gradient: "from-yellow-300 to-amber-500", text: "text-yellow-900" };
  if (rank === 2) return { Icon: Medal,  gradient: "from-slate-300 to-slate-500", text: "text-slate-900" };
  if (rank === 3) return { Icon: Award,  gradient: "from-orange-400 to-amber-700", text: "text-amber-900" };
  return null;
}

// ─── MBTI 16 型图标 ────────────────────────────────────────────────────────
// 每种类型一个 lucide 图标，对应这个类型的"标签"（建筑师 → 城堡、科学家 → 烧瓶等）。
export const MBTI_ICONS: Record<string, LucideIcon> = {
  // 分析师（NT）
  INTJ: Castle,         // 建筑师 / 谋略家
  INTP: FlaskConical,   // 思想家 / 科学家
  ENTJ: Crown,          // 指挥官
  ENTP: Lightbulb,      // 辩论家 / 创新者
  // 外交官（NF）
  INFJ: Compass,        // 提倡者 / 理想主义
  INFP: Feather,        // 调停者 / 诗人
  ENFJ: Megaphone,      // 主人公
  ENFP: Sun,            // 竞选者 / 阳光
  // 哨兵（SJ）
  ISTJ: ClipboardCheck, // 物流师 / 一丝不苟
  ISFJ: Shield,         // 守卫者
  ESTJ: Briefcase,      // 总经理
  ESFJ: HeartHandshake, // 执政官
  // 探险家（SP）
  ISTP: Wrench,         // 鉴赏家 / 工匠
  ISFP: Palette,        // 探险家 / 艺术家
  ESTP: Rocket,         // 企业家
  ESFP: PartyPopper,    // 表演者
};

// ─── 通用游戏图标渲染 helper ───────────────────────────────────────────────
export function GameIcon({
  gameId,
  size = 22,
  className = "",
}: {
  gameId: GameId;
  size?: number;
  className?: string;
}) {
  const Icon = GAME_ICONS[gameId];
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={2.2} />;
}
