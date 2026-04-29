// 黑洞游戏的 3D 模型池 —— manifest 加载 + 随机抽取 + 颜色变换
//
// 设计：
// 1. manifest.json 在 public/models/black-hole/ 下，运行时 fetch（方便你不改代码改模型）
// 2. 每个 tier 的 manifest 列表里有 GLB 时 → 优先用 GLB
// 3. 列表为空时 → fallback 到内置的几何体形状（保证游戏永远能玩）
// 4. 每个实例还有：随机缩放 + 旋转 + 色调微偏移 → 同一模型也能千变万化

export interface ModelEntry {
  file: string;       // 相对 public/models/black-hole/，如 "tier_2/house-01.glb" 或 "tier_2/house-01.stl"
  name: string;       // 开发参考用
  mass: number;       // 被吞噬增加多少质量
  scaleHint: number;  // 基础缩放（默认 1.0；模型太大/太小时调这个）
  yOffset: number;    // 抬高多少（如果模型原点不在脚底）
  // STL 文件没有材质/颜色 —— 必须在这里指定。GLB 文件可不填（用模型自带的）
  defaultColor?: string; // hex e.g. "#fde68a"
}

// 根据文件扩展名判定格式
export function getModelFormat(file: string): "glb" | "gltf" | "stl" | "unknown" {
  const lower = file.toLowerCase();
  if (lower.endsWith(".glb")) return "glb";
  if (lower.endsWith(".gltf")) return "gltf";
  if (lower.endsWith(".stl")) return "stl";
  return "unknown";
}

export interface ModelManifest {
  tier_0: ModelEntry[];
  tier_1: ModelEntry[];
  tier_2: ModelEntry[];
  tier_3: ModelEntry[];
}

export type Tier = 0 | 1 | 2 | 3;

// 内置的 fallback 几何体种类
export type ShapeKind =
  | "bush"
  | "tree"
  | "fireHydrant"
  | "car"
  | "phoneBox"
  | "house"
  | "shop"
  | "skyscraper"
  | "tower";

const FALLBACK_KINDS: ShapeKind[][] = [
  ["bush", "tree", "fireHydrant"],   // tier 0
  ["car", "phoneBox"],                // tier 1
  ["house", "shop"],                  // tier 2
  ["skyscraper", "tower"],            // tier 3
];

// fallback 几何体的默认 mass（与 BlackHoleScene 里 SHAPE_MASS 保持同步）
const FALLBACK_KIND_MASS: Record<ShapeKind, number> = {
  bush: 4,
  tree: 8,
  fireHydrant: 6,
  car: 28,
  phoneBox: 35,
  house: 90,
  shop: 110,
  skyscraper: 280,
  tower: 380,
};

export function emptyManifest(): ModelManifest {
  return { tier_0: [], tier_1: [], tier_2: [], tier_3: [] };
}

// 客户端运行时加载 manifest
export async function loadManifest(): Promise<ModelManifest> {
  try {
    const res = await fetch("/models/black-hole/manifest.json", {
      cache: "no-store",
    });
    if (!res.ok) return emptyManifest();
    const data = await res.json();
    // 容错：缺失 tier 字段时填空数组
    return {
      tier_0: Array.isArray(data.tier_0) ? data.tier_0 : [],
      tier_1: Array.isArray(data.tier_1) ? data.tier_1 : [],
      tier_2: Array.isArray(data.tier_2) ? data.tier_2 : [],
      tier_3: Array.isArray(data.tier_3) ? data.tier_3 : [],
    };
  } catch {
    return emptyManifest();
  }
}

// 一个抽样后的具体物品
export interface SampledItem {
  model: ModelEntry | null;       // null = 用 fallback 几何体
  fallbackKind: ShapeKind;        // model 为 null 时使用
  tier: Tier;
  mass: number;
  scale: number;                  // 综合 scaleHint × 随机抖动
  rotation: number;               // Y 轴随机
  hueShift: number;               // -0.08 ~ +0.08，色调微偏移让同模型不雷同
  flipX: boolean;                 // 50% 概率沿 X 轴翻转
  yOffset: number;
}

export function pickTier(
  distribution: [number, number, number, number]
): Tier {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < 4; i++) {
    cum += distribution[i];
    if (r < cum) return i as Tier;
  }
  return 0;
}

// 给定 tier，从 manifest 抽一个 GLB 模型；如果 tier 为空 → fallback 到几何体
export function sampleItemForTier(tier: Tier, manifest: ModelManifest): SampledItem {
  const tierKey = (`tier_${tier}` as const) as keyof ModelManifest;
  const models = manifest[tierKey];

  const baseScale = 0.9 + Math.random() * 0.25;
  const rotation = Math.random() * Math.PI * 2;
  const hueShift = (Math.random() - 0.5) * 0.16;
  const flipX = Math.random() < 0.5;

  if (models.length > 0) {
    const m = models[Math.floor(Math.random() * models.length)];
    return {
      model: m,
      fallbackKind: FALLBACK_KINDS[tier][0], // 未使用
      tier,
      mass: m.mass,
      scale: (m.scaleHint ?? 1.0) * baseScale,
      rotation,
      hueShift,
      flipX,
      yOffset: m.yOffset ?? 0,
    };
  }

  // Fallback
  const kinds = FALLBACK_KINDS[tier];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  return {
    model: null,
    fallbackKind: kind,
    tier,
    mass: FALLBACK_KIND_MASS[kind],
    scale: baseScale,
    rotation,
    hueShift: 0, // fallback 几何体不偏色，否则颜色会乱
    flipX: false,
    yOffset: 0,
  };
}
