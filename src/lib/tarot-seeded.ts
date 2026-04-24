import type { DrawnCard } from "./tarot-data";
import { MAJOR_ARCANA } from "./tarot-data";

/** 32-bit 可复现 PRNG（mulberry32） */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildShuffleSeed(input: {
  pointerPathPx: number;
  durationMs: number;
  lastX: number;
  lastY: number;
}): number {
  const a = Math.floor(input.pointerPathPx * 1000) >>> 0;
  const b = (input.durationMs >>> 0) ^ 0x9e3779b9;
  const c = Math.floor(input.lastX * 1000) >>> 0;
  const d = Math.floor(input.lastY * 1000) >>> 0;
  return (a ^ (b << 1) ^ (c << 2) ^ (d << 3)) >>> 0;
}

/** 与 `drawThreeCards` 相同规则，但使用洗牌阶段得到的 seed */
export function drawThreeCardsSeeded(seed: number): DrawnCard[] {
  const rnd = mulberry32(seed);
  const pool = [...MAJOR_ARCANA];
  const drawn: DrawnCard[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(rnd() * pool.length);
    const card = pool.splice(idx, 1)[0]!;
    drawn.push({ card, reversed: rnd() < 0.5 });
  }
  return drawn;
}
