// 所有游戏共享的难度枚举与配置。
// 每个游戏在自己的 page.tsx 里导入对应的 *_CONFIG[difficulty]。

export type Difficulty = "easy" | "medium" | "hard" | "hell";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "hell"];

export const DEFAULT_DIFFICULTY: Difficulty = "medium";

// Tailwind gradient colors for each difficulty pill.
export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy:   "from-green-500 to-emerald-600",
  medium: "from-blue-500 to-indigo-600",
  hard:   "from-orange-500 to-red-600",
  hell:   "from-red-600 to-rose-900",
};

export const DIFFICULTY_ICONS: Record<Difficulty, string> = {
  easy:   "🟢",
  medium: "🔵",
  hard:   "🟠",
  hell:   "🔥",
};

// ─── Per-game parameter configs ────────────────────────────────────────────
// 每个游戏定义自己的参数形状，所有 difficulty 级别都要填。

// reaction-time
//   waitMin/waitMax: 两次事件间等待的区间 (ms)，每次都独立 random
//   minDistractors/maxDistractors: 一轮内出现 N 个干扰色 (N 均匀随机)
//   distractorColors: 干扰色可选池 — 每个干扰独立从中随机挑
//   distractorMs: 每个干扰色显示时长
//   greenTurnsRedChance: 一轮中"绿变红"发生的概率 (0 = 永不；1 = 每次都变)
//   greenTimeoutMs: 绿色持续多久才变红 (只在 greenTurnsRedChance > 0 时用)
//
// 效果：每轮都是新 roll —— 有时 0 干扰直接绿，有时连续 3 个红干扰才给你绿，
// hell 还要赌这次绿到底稳不稳。完全没有可预测模式。
export const REACTION_TIME_CONFIG: Record<
  Difficulty,
  {
    waitMin: number;
    waitMax: number;
    minDistractors: number;
    maxDistractors: number;
    distractorColors: Array<"yellow" | "red">;
    distractorMs: number;
    greenTurnsRedChance: number;
    greenTimeoutMs: number;
  }
> = {
  easy: {
    waitMin: 2000, waitMax: 5000,
    minDistractors: 0, maxDistractors: 0,
    distractorColors: [],
    distractorMs: 400,
    greenTurnsRedChance: 0,
    greenTimeoutMs: 0,
  },
  medium: {
    waitMin: 1500, waitMax: 4500,
    minDistractors: 0, maxDistractors: 2,
    distractorColors: ["yellow"],
    distractorMs: 450,
    greenTurnsRedChance: 0,
    greenTimeoutMs: 0,
  },
  hard: {
    waitMin: 1000, waitMax: 3500,
    minDistractors: 0, maxDistractors: 3,
    distractorColors: ["yellow", "red"],
    distractorMs: 400,
    greenTurnsRedChance: 0,
    greenTimeoutMs: 0,
  },
  hell: {
    waitMin: 500, waitMax: 2500,
    minDistractors: 0, maxDistractors: 3,
    distractorColors: ["yellow", "red"],
    distractorMs: 350,
    greenTurnsRedChance: 0.55, // 一半多一点的概率绿色会变红
    greenTimeoutMs: 400,
  },
};

// number-memory
//   startLevel: 起始等级 (最终位数 = startLevel + 2)
//   msPerDigit: 每位数字的"展示"时长
//   minMs: 展示时长下限
//   inputMsPerDigit: 每位数字的"输入"时长；null = 不限时
//   inputMinMs: 输入总时长下限
//
// 设计：
//   Easy    = 基线 (显示 800ms/位 · 输入不限时)  —— 维持老体验
//   Medium  = 显示同 Easy · 输入开始有倒计时 (约 1s 紧一点)
//   Hard    = 显示缩短 · 输入和 Medium 相同
//   Hell    = 显示大幅缩短 · 输入大幅缩短
//
// 实际每轮展示/输入时长会按当前 level 的 digits 动态计算：
//   show  = max(minMs, digits * msPerDigit)
//   input = max(inputMinMs, digits * inputMsPerDigit)  (Medium/Hard/Hell)
export const NUMBER_MEMORY_CONFIG: Record<
  Difficulty,
  {
    startLevel: number;
    msPerDigit: number;
    minMs: number;
    inputMsPerDigit: number | null;
    inputMinMs: number;
  }
> = {
  easy: {
    startLevel: 1,
    msPerDigit: 800, minMs: 1500,           // 显示：基线（宽松）
    inputMsPerDigit: null, inputMinMs: 0,    // 输入：不限时
  },
  medium: {
    startLevel: 1,
    msPerDigit: 800, minMs: 1500,           // 显示：和 Easy 一样
    inputMsPerDigit: 1200, inputMinMs: 4000, // 输入：每位 1.2s，至少 4s 总时长
  },
  hard: {
    startLevel: 3,
    msPerDigit: 400, minMs: 800,            // 显示：缩短一半
    inputMsPerDigit: 1200, inputMinMs: 4000, // 输入：同 Medium，不变
  },
  hell: {
    startLevel: 5,
    msPerDigit: 250, minMs: 400,            // 显示：大幅缩短
    inputMsPerDigit: 500, inputMinMs: 1500,  // 输入：大幅缩短（0.5s/位，至少 1.5s）
  },
};

// sequence-memory
//   startLen: 起始序列长度
//   gridSize: N×N 方阵
//   flashMs: 每个格子亮的时间
//   gapMs: 相邻格子之间的间隔
export const SEQUENCE_MEMORY_CONFIG: Record<
  Difficulty,
  { startLen: number; gridSize: number; flashMs: number; gapMs: number }
> = {
  easy:   { startLen: 2, gridSize: 3, flashMs: 700, gapMs: 300 }, // 基线
  medium: { startLen: 2, gridSize: 3, flashMs: 550, gapMs: 220 }, // 同尺寸，只是节奏稍快
  hard:   { startLen: 3, gridSize: 4, flashMs: 400, gapMs: 150 }, // 大格子 + 明显快
  hell:   { startLen: 4, gridSize: 5, flashMs: 300, gapMs: 100 }, // 最激进
};

// visual-memory
//   startTiles: 起始需要记住的格子数
//   startGrid: 起始网格 N×N
//   showMs: 展示的时间
//   maxLives: 允许的错误次数
export const VISUAL_MEMORY_CONFIG: Record<
  Difficulty,
  { startTiles: number; startGrid: number; showMs: number; maxLives: number }
> = {
  easy:   { startTiles: 3, startGrid: 3, showMs: 2500, maxLives: 4 }, // unchanged
  medium: { startTiles: 4, startGrid: 4, showMs: 2000, maxLives: 3 }, // 4 tiles on 4×4 (more room & more targets)
  hard:   { startTiles: 5, startGrid: 5, showMs: 1500, maxLives: 2 }, // unchanged
  hell:   { startTiles: 7, startGrid: 6, showMs: 1000, maxLives: 1 }, // unchanged
};

// cps-test
//   durationMs: 计时窗口
export const CPS_TEST_CONFIG: Record<Difficulty, { durationMs: number }> = {
  easy:   { durationMs: 15000 },
  medium: { durationMs: 10000 },
  hard:   { durationMs: 5000 },
  hell:   { durationMs: 3000 },
};

// aim-trainer
//   durationSec: 游戏时长 (秒)
//   targetDiameterPx: 旧版 2D 靶直径（排行榜/展示仍可参考）
//   targetLifeMs: 靶出现后多久自动消失 (null = 一直等到点中；超时 = miss 并换下一个)
//   sphereRadius: 3D 场景中球体半径（世界单位）
export const AIM_TRAINER_CONFIG: Record<
  Difficulty,
  {
    durationSec: number;
    targetDiameterPx: number;
    targetLifeMs: number | null;
    sphereRadius: number;
  }
> = {
  easy:   { durationSec: 30, targetDiameterPx: 90, targetLifeMs: null, sphereRadius: 0.55 },
  medium: { durationSec: 30, targetDiameterPx: 56, targetLifeMs: 2500, sphereRadius: 0.36 },
  hard:   { durationSec: 30, targetDiameterPx: 40, targetLifeMs: null, sphereRadius: 0.26 },
  hell:   { durationSec: 30, targetDiameterPx: 40, targetLifeMs: 1200, sphereRadius: 0.24 },
};

// last-hit (MOBA 补刀 — 真正的 LoL 模型)
//
// 核心：敌方小兵有 HP，盟军的远程兵会一下下把它打死（每一下扣固定伤害），
// 你自己也有一个 ATK 数值 —— 你的普攻能一击打掉 ATK 点 HP。
// 只有你的攻击是"致命一击"（打完后 HP≤0）才算补到刀（得金币）。
// 你的攻击有弹道飞行时间，期间盟军可能抢先把兵打死 = 被抢。
//
//   rounds:         一局有几波兵（每波一个敌人）
//   minionHp:       敌方小兵血量（统一 100，便于心算）
//   playerAtk:      你的一次普攻伤害 → 这也就是"击杀窗口"的上限 (HP≤playerAtk 可杀)
//   playerTravelMs: 你的弹道飞行时间（远程英雄特性；近战 ≈ 0）
//   allyDamage:     每个盟军兵一次攻击打多少伤害
//   allyHits:       一波内总共来多少次盟军攻击（够不够杀死小兵）
//   allyIntervalMs: 两次盟军攻击之间的基础间隔（再加 ±jitter）
//   allyIntervalJitterMs: 间隔随机扰动，让节奏不可预测
//   towerDamage:    防御塔一次攻击伤害（hell 才有塔；其他设 0）
//   towerIntervalMs: 塔攻击间隔（hell 用）
export const LAST_HIT_CONFIG: Record<
  Difficulty,
  {
    rounds: number;
    minionHp: number;
    playerAtk: number;
    playerTravelMs: number;
    allyDamage: number;
    allyHits: number;
    allyIntervalMs: number;
    allyIntervalJitterMs: number;
    towerDamage: number;
    towerIntervalMs: number;
  }
> = {
  // HP schedule examples (allies-only, no player intervention):
  //   easy  ally=15, 7 hits → 100→85→70→55→40→25→10→dies
  //   med   ally=15, 7 hits → same schedule, shorter interval
  //   hard  ally=14, 8 hits → 100→86→72→58→44→30→16→2→dies
  //   hell  ally=13, 8 hits → 100→87→74→61→48→35→22→9→dies (+ tower chaos)
  //
  // Kill window opens when HP ≤ playerAtk. With playerAtk ≈ 20% of maxHp,
  // window only appears in the final 1-2 ally hits — matching real LoL feel.
  easy: {
    rounds: 12, minionHp: 100, playerAtk: 25, playerTravelMs: 300,
    allyDamage: 15, allyHits: 7, allyIntervalMs: 850, allyIntervalJitterMs: 120,
    towerDamage: 0, towerIntervalMs: 0,
  },
  medium: {
    rounds: 15, minionHp: 100, playerAtk: 20, playerTravelMs: 400,
    allyDamage: 15, allyHits: 7, allyIntervalMs: 650, allyIntervalJitterMs: 180,
    towerDamage: 0, towerIntervalMs: 0,
  },
  hard: {
    rounds: 15, minionHp: 100, playerAtk: 16, playerTravelMs: 500,
    allyDamage: 14, allyHits: 8, allyIntervalMs: 520, allyIntervalJitterMs: 220,
    towerDamage: 0, towerIntervalMs: 0,
  },
  hell: {
    rounds: 15, minionHp: 100, playerAtk: 12, playerTravelMs: 500,
    allyDamage: 13, allyHits: 8, allyIntervalMs: 400, allyIntervalJitterMs: 280,
    // 塔固定 50 伤害、1.5s 间隔 —— 塔打两下就切 100 HP，会强行插到节奏里
    towerDamage: 50, towerIntervalMs: 1500,
  },
};

// skill-shot (MOBA 技能预判)
//   shots: 一局投几次
//   travelMs: 技能命中的飞行时间 (点击后等 travelMs 才判定)
//   tolerancePx: 落点与目标距离在这个像素内算命中
//   path: 目标运动模式
//   speedPctPerSec: 目标每秒跑过 arena 多少百分比 (speed)
export const SKILL_SHOT_CONFIG: Record<
  Difficulty,
  {
    shots: number;
    travelMs: number;
    tolerancePx: number;
    path: "straight" | "zigzag" | "wave" | "erratic";
    speedPctPerSec: number;
  }
> = {
  easy:   { shots: 15, travelMs: 300, tolerancePx: 45, path: "straight", speedPctPerSec: 25 },
  medium: { shots: 15, travelMs: 400, tolerancePx: 35, path: "zigzag",   speedPctPerSec: 35 },
  hard:   { shots: 15, travelMs: 500, tolerancePx: 28, path: "wave",     speedPctPerSec: 45 },
  hell:   { shots: 15, travelMs: 600, tolerancePx: 22, path: "erratic",  speedPctPerSec: 55 },
};

// combo (连招尝试)
//   keys: 该难度允许出现的按键池
//   startLen: 起始连招长度
//   showMsPerKey: 每个键展示时长 (展示阶段的节奏)
//   inputMsPerKey: 每个键允许的输入时长 (null = 不限时)
//   inputMinMs: 输入总时长下限
export const COMBO_CONFIG: Record<
  Difficulty,
  {
    keys: string[];
    startLen: number;
    showMsPerKey: number;
    inputMsPerKey: number | null;
    inputMinMs: number;
  }
> = {
  easy:   { keys: ["Q", "W"],                startLen: 3, showMsPerKey: 700, inputMsPerKey: null, inputMinMs: 0    },
  medium: { keys: ["Q", "W", "E"],           startLen: 3, showMsPerKey: 550, inputMsPerKey: 1500, inputMinMs: 5000 },
  hard:   { keys: ["Q", "W", "E", "R"],      startLen: 3, showMsPerKey: 450, inputMsPerKey: 1200, inputMinMs: 4000 },
  hell:   { keys: ["Q", "W", "E", "R", "A"], startLen: 4, showMsPerKey: 350, inputMsPerKey: 700,  inputMinMs: 2500 },
};

// typing-test
//   durationSec: 时间窗口 (秒) —— 同时给出一个合适的上限
//   passageTier: 用哪个难度等级的文章池 (来自 typing-passages.ts)
//
// 设计：内容本身是主要的难度来源（一层一层递进），时间也略有变化。
//   easy   → 简单日常词
//   medium → 混合名句 + 标点
//   hard   → 长难词、复合句
//   hell   → 代码、符号、数字、密码样式 —— 打字地狱
export const TYPING_TEST_CONFIG: Record<
  Difficulty,
  { durationSec: number; passageTier: Difficulty }
> = {
  easy:   { durationSec: 60, passageTier: "easy"   },
  medium: { durationSec: 60, passageTier: "medium" },
  hard:   { durationSec: 75, passageTier: "hard"   }, // 长难词需要更多时间
  hell:   { durationSec: 90, passageTier: "hell"   }, // 代码/符号打起来慢
};
