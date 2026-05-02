/**
 * Synthetic leaderboard fixtures.
 *
 * 150 个假用户（混合中英西三语昵称 + 多元国旗），每人都有一个 0..1 的
 * 综合 skill。结合 game 的分数范围 + difficulty modifier + 确定性 hash，
 * 算出每个用户在每个游戏 × 难度下的具体分数。
 *
 * 关键性质：
 *   - 每次同样输入返回同样输出（hash 有种子，没有 Math.random）
 *   - 真实用户提交分数后，仍会被合并进排行榜并按正确顺序排
 *   - 排行榜始终非空 —— 新部署的服务也能展示
 */
import type { GameId } from "./utils";
import type { Difficulty } from "./difficulty";

// ─── 150 个假用户 ──────────────────────────────────────────────────────────────
//
// 每条：id 稳定不变；name 显示名；skill 是 0..1 的综合天赋。
// 头像不在这里 —— 由 `<UserAvatar userId=...>` 用 hash 生成两色渐变 + 首字母。
// 高 skill 用户在大部分游戏里都靠前，但 specialty 让某些用户在特定游戏里
// 更突出（避免所有榜单都是同样的 top10）。

interface SyntheticUser {
  id: string;
  name: string;
  /** 综合天赋 0..1，1 = 顶尖玩家 */
  skill: number;
  /** 在这些游戏里额外 +0.15 ~ +0.25 的分数加成 */
  specialty: GameId[];
}

const NAMES_EN = [
  "NeonPhantom", "swift_arrow", "Gizmo", "Vortex", "RiotKid", "midas.fox",
  "JadeViper", "Whisper", "darkflame", "Atlas", "Nova", "PixelPete",
  "Quasar", "Echo", "MirrorMaze", "saltyTuna", "Glitchwave", "ironGrip",
  "SoloLane", "Chronos", "Reverie", "ZenMode", "Rogue", "MochaShot",
  "Tempest", "Apex", "Cinder", "frostByte", "Wanderlust", "doomglide",
  "stormrider", "Eclipse", "phoenix", "RustyKnight", "Vega", "Hex",
  "Cypher", "Maverick", "Halcyon", "Specter", "wildebeest", "lazuli",
  "Onyx", "Sable", "darklotus", "Drift", "marrow", "Fable",
  "ironcrest", "Solace",
];

const NAMES_ZH = [
  "夜雨听风", "刀光剑影", "凉茶不加糖", "墨染青衣", "梦回大唐", "雪落无声",
  "九重天", "孤城望月", "醉卧花间", "白衣胜雪", "千夜", "暮云归",
  "月下饮酒", "南柯一梦", "青山如黛", "竹影摇风", "苍穹之眼", "玄铁重剑",
  "风暴之刃", "星河", "落日余晖", "蓝桥旧梦", "陌上花开", "秋水共长天",
  "渔舟唱晚", "海棠未雨", "燕过留痕", "蝉鸣三秋", "故里月光", "春寒料峭",
  "断桥残雪", "雾失楼台", "山水相逢", "红尘客", "听雨阁", "无名小卒",
  "江湖夜雨", "归去来兮", "醉笑陪君", "灯火阑珊", "梅子青", "玉玲珑",
  "残卷", "孤独剑客", "冷月", "九霄", "苏暮雨", "云深处",
  "倾城", "踏雪寻梅",
];

const NAMES_ES = [
  "Lobo_Solo", "AzulMar", "Tormenta", "Cazador", "Zafiro", "Halcón",
  "VientoNorte", "Aurora", "FuegoFatuo", "Lince", "Sirena", "Cuervo",
  "Centella", "RayoNegro", "Quetzal", "Marisol", "Tonatiuh", "Solterón",
  "MateoFox", "PlomoPuro", "el_topo", "Cobra", "Hierro", "MentaFresca",
  "GataNoche", "RubíRoja", "Sol_y_Sombra", "Lunita", "Corazón", "Trueno",
  "Galeón", "Brisa", "PicaPica", "Olé", "TigreSur", "RonAñejo",
  "Almendra", "PiedraNegra", "MayaQ", "Lluvia", "Nopalito", "Cactus",
  "Furia", "OroNegro", "Pichón", "Manzanita", "Verónica", "Leyenda",
  "MagoFiero", "Risas",
];

const ALL_GAME_IDS: GameId[] = [
  "reaction-time", "number-memory", "sequence-memory", "visual-memory",
  "cps-test", "aim-trainer", "typing-test",
  "verbal-memory",
  "goose-grab", "black-hole",
  "sheep", "skillshot-dodge",
] as const;

// 简单确定性 hash：string → 0..1
function hashFloat(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const p of parts) {
    const s = String(p);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  // 变成 0..1 的非负浮点数
  return ((h >>> 0) % 100000) / 100000;
}

// 一次性构造所有 150 个用户
function buildUsers(): SyntheticUser[] {
  const all: SyntheticUser[] = [];
  const langs = [
    { names: NAMES_EN, prefix: "en" },
    { names: NAMES_ZH, prefix: "zh" },
    { names: NAMES_ES, prefix: "es" },
  ];
  for (const { names, prefix } of langs) {
    for (let i = 0; i < names.length; i++) {
      const id = `synth_${prefix}_${String(i).padStart(2, "0")}`;
      // skill 沿正态-ish 分布：用 3 个 hash 平均，得到 bell shape
      const a = hashFloat(id, "a");
      const b = hashFloat(id, "b");
      const c = hashFloat(id, "c");
      const skill = (a + b + c) / 3; // 大多数集中在 0.3..0.7
      // specialty：每个用户随机挑 1-2 个游戏作为强项
      const numSpec = 1 + Math.floor(hashFloat(id, "n") * 2);
      const specialty: GameId[] = [];
      for (let s = 0; s < numSpec; s++) {
        const pick =
          ALL_GAME_IDS[
            Math.floor(hashFloat(id, "spec", s) * ALL_GAME_IDS.length)
          ];
        if (pick && !specialty.includes(pick)) specialty.push(pick);
      }
      all.push({ id, name: names[i], skill, specialty });
    }
  }
  return all;
}

export const SYNTHETIC_USERS: readonly SyntheticUser[] = buildUsers();

// ─── 每个游戏的分数模型 ─────────────────────────────────────────────────────
//
// 每个游戏给一个映射函数：(skill 0..1) → 分数。
// skill=0 是新手（最差但合理的成绩），skill=1 是顶级。
// difficulty 难度修正在外面叠加。

interface GameScoreModel {
  /** 较低分=较好（如反应时间）*/
  lowerIsBetter: boolean;
  /** skill=0 时的分数（最菜玩家的表现）*/
  worst: number;
  /** skill=1 时的分数（顶尖表现）*/
  best: number;
  /** 这个游戏适合哪个难度修正方向 */
  hasDifficulty: boolean;
  /** 取整 */
  round?: "int" | number; // number = 保留小数位数
}

const GAME_MODELS: Record<GameId, GameScoreModel> = {
  // ── 认知 ──
  "reaction-time":   { lowerIsBetter: true,  worst: 480,  best: 165,  hasDifficulty: true,  round: "int" },
  "number-memory":   { lowerIsBetter: false, worst: 4,    best: 14,   hasDifficulty: true,  round: "int" },
  "sequence-memory": { lowerIsBetter: false, worst: 4,    best: 18,   hasDifficulty: true,  round: "int" },
  "visual-memory":   { lowerIsBetter: false, worst: 5,    best: 22,   hasDifficulty: true,  round: "int" },
  "cps-test":        { lowerIsBetter: false, worst: 4.0,  best: 13.5, hasDifficulty: false, round: 1 },
  "aim-trainer":     { lowerIsBetter: false, worst: 18,   best: 58,   hasDifficulty: true,  round: "int" },
  "typing-test":     { lowerIsBetter: false, worst: 32,   best: 118,  hasDifficulty: true,  round: "int" },
  "verbal-memory":   { lowerIsBetter: false, worst: 10,   best: 120,  hasDifficulty: true,  round: "int" },
  // ── 休闲 ──
  "goose-grab":      { lowerIsBetter: false, worst: 1,    best: 9,    hasDifficulty: false, round: "int" },
  "black-hole":      { lowerIsBetter: false, worst: 80,   best: 480,  hasDifficulty: false, round: "int" },
  "sheep":           { lowerIsBetter: false, worst: 1,    best: 8,    hasDifficulty: false, round: "int" },
  "skillshot-dodge": { lowerIsBetter: false, worst: 5,    best: 90,   hasDifficulty: true,  round: "int" },
};

// 难度对分数的影响
//   - lowerIsBetter（反应时间）：hell 难度反而能跑出更低（更好）的分数？不对。
//     不同难度其实是不同游戏循环 —— 但这里我们让 easy 比 hell 容易拿高分。
//   - 简化：easy = 1.15 倍能到的高分；hell = 0.7 倍。
//     对 lowerIsBetter 取倒数处理，让 easy 反而更"快"（因为容易）。
function difficultyModifier(diff: Difficulty, lowerIsBetter: boolean): number {
  const map: Record<Difficulty, number> = {
    easy: 1.15,
    medium: 1.0,
    hard: 0.85,
    hell: 0.7,
  };
  const m = map[diff];
  return lowerIsBetter ? 1 / m : m; // lower=better 时 easy 的"好分数"是更小的数
}

/**
 * 给定 user + game + difficulty，算出这个 user 的本场分数。
 */
function userScoreFor(
  user: SyntheticUser,
  game: GameId,
  difficulty: Difficulty
): number {
  const model = GAME_MODELS[game];
  if (!model) return 0;

  // specialty 加成
  const specBonus = user.specialty.includes(game) ? 0.18 : 0;
  // 在 user.skill 周围抖一点（让同 skill 的用户分数不完全一样）
  const noise = (hashFloat(user.id, game, difficulty) - 0.5) * 0.18;
  const effective = Math.max(0, Math.min(1, user.skill + specBonus + noise));

  // 线性插值 worst → best 在 effective skill 上
  let raw = model.worst + (model.best - model.worst) * effective;

  // 难度修正
  if (model.hasDifficulty) {
    raw *= difficultyModifier(difficulty, model.lowerIsBetter);
  }

  // 取整
  if (model.round === "int") return Math.round(raw);
  if (typeof model.round === "number") {
    const f = Math.pow(10, model.round);
    return Math.round(raw * f) / f;
  }
  return raw;
}

/**
 * 生成一个 game/difficulty 的合成排行榜（带 createdAt 时间戳）。
 *
 * 注意：返回的 createdAt 是稳定的 Date 实例，避免 hydration 不一致。
 */
export function generateFakeLeaderboard(
  game: GameId,
  difficulty: Difficulty
): Array<{
  userId: string;
  userName: string;
  value: number;
  createdAt: Date;
  synthetic: true;
}> {
  const model = GAME_MODELS[game];
  if (!model) return [];

  // 用一个稳定 base date —— 不要用 new Date() 否则每次都变
  const BASE = new Date("2026-04-01T00:00:00Z").getTime();

  return SYNTHETIC_USERS.map((u) => {
    const value = userScoreFor(u, game, difficulty);
    // 时间戳：用 hash 在过去 90 天内分散
    const offset = Math.floor(hashFloat(u.id, game, difficulty, "ts") * 90 * 86400 * 1000);
    return {
      userId: u.id,
      userName: u.name,
      value,
      createdAt: new Date(BASE - offset),
      synthetic: true as const,
    };
  });
}

/** 给定 userId，看它是不是合成用户（用于 UI 标记 / 排除自己被替换）*/
export function isSyntheticUser(userId: string): boolean {
  return userId.startsWith("synth_");
}
