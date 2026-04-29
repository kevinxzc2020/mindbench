"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import { TILE_MATCH_CONFIG, type Difficulty } from "@/lib/difficulty";
import { cn } from "@/lib/utils";

// 3D 背景 —— 糖果系漂浮形状。客户端动态加载，避免 SSR 报错
const TileMatchBackground = dynamic(() => import("./TileMatchBackground"), {
  ssr: false,
  loading: () => null,
});

type Phase = "idle" | "playing" | "won" | "lost";

// 牌面图案（emoji 视觉，每个 type 一个）—— 可扩展到 10 种
const TILE_EMOJIS = ["🍎", "🍇", "🍊", "🍓", "🥝", "🍑", "🍌", "🍒", "🍍", "🥥"] as const;

interface Tile {
  id: number;
  type: number; // 0..typeCount-1
  x: number; // 0..1 normalized board position
  y: number;
  layer: number; // higher = on top
  removed: boolean;
}

// 生成一个保证可解的牌堆：每种图案数量都是 3 的倍数
function generateBoard(level: number, baseCfg: typeof TILE_MATCH_CONFIG[Difficulty]): Tile[] {
  // 难度递进：每过一关 +5% 牌、+1 锁
  const tileCount = Math.floor(baseCfg.tileCount * (1 + (level - 1) * 0.05));
  const lockedTiles = Math.min(
    Math.floor(tileCount / 2),
    baseCfg.lockedTiles + (level - 1) * 2
  );
  const typeCount = baseCfg.typeCount;
  const layerDepth = baseCfg.layerDepth;

  // 把 tileCount 凑成 3 的倍数（向下取整）
  const realCount = Math.floor(tileCount / 3) * 3;
  const tilesPerType = Math.floor(realCount / typeCount / 3) * 3;
  const total = tilesPerType * typeCount;

  // 生成所有牌
  const types: number[] = [];
  for (let t = 0; t < typeCount; t++) {
    for (let n = 0; n < tilesPerType; n++) {
      types.push(t);
    }
  }
  // Fisher-Yates shuffle
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  // 在 8x6 网格的"格点"上撒，加点抖动
  const cols = 8;
  const rows = 6;
  const tiles: Tile[] = [];
  let id = 0;
  for (let i = 0; i < total; i++) {
    const layer = Math.min(layerDepth - 1, Math.floor(i / (cols * rows)));
    const slotIdx = i % (cols * rows);
    const baseX = (slotIdx % cols) / cols + 0.5 / cols;
    const baseY = Math.floor(slotIdx / cols) / rows + 0.5 / rows;
    const jitterX = (Math.random() - 0.5) * 0.04;
    const jitterY = (Math.random() - 0.5) * 0.04;
    tiles.push({
      id: id++,
      type: types[i],
      x: baseX + jitterX,
      y: baseY + jitterY,
      layer: layer + Math.random() * 0.4, // 同 layer 内也错开
      removed: false,
    });
  }
  return tiles;
}

// 一张牌"被另一张牌覆盖" = 存在另一张未消除的牌, 它的 layer 比我高 且 距离 < threshold
function isCoveredBy(tile: Tile, others: Tile[]): boolean {
  const threshold = 0.06;
  for (const o of others) {
    if (o.removed) continue;
    if (o.id === tile.id) continue;
    if (o.layer <= tile.layer) continue;
    const dx = o.x - tile.x;
    const dy = o.y - tile.y;
    if (dx * dx + dy * dy < threshold * threshold) return true;
  }
  return false;
}

export default function TileMatchPage() {
  return (
    <GameWrapper gameId="tile-match">
      {(onComplete, difficulty) => (
        <TileMatchGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function TileMatchGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = TILE_MATCH_CONFIG[difficulty];

  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [slot, setSlot] = useState<Tile[]>([]);

  const remaining = useMemo(
    () => tiles.filter((t) => !t.removed).length,
    [tiles]
  );

  const startLevel = useCallback(
    (lvl: number) => {
      const newTiles = generateBoard(lvl, cfg);
      setTiles(newTiles);
      setSlot([]);
      setPhase("playing");
    },
    [cfg]
  );

  const handleTileClick = (tile: Tile) => {
    if (phase !== "playing") return;
    if (tile.removed) return;
    // 必须是顶层（无被覆盖）
    if (isCoveredBy(tile, tiles)) return;

    // 标记为 removed (从 board 移除)
    const newTiles = tiles.map((tt) =>
      tt.id === tile.id ? { ...tt, removed: true } : tt
    );
    const newSlot = [...slot, tile];

    // 自动消除：找到 slot 里 3 张同 type
    const counts: Record<number, number> = {};
    for (const s of newSlot) {
      counts[s.type] = (counts[s.type] ?? 0) + 1;
    }
    let finalSlot = newSlot;
    for (const typeStr of Object.keys(counts)) {
      const type = Number(typeStr);
      if (counts[type] >= 3) {
        // 移除最早的 3 张该 type
        let removedSoFar = 0;
        finalSlot = finalSlot.filter((s) => {
          if (s.type === type && removedSoFar < 3) {
            removedSoFar++;
            return false;
          }
          return true;
        });
      }
    }

    // 排序 slot：同 type 的牌相邻，方便观察
    finalSlot.sort((a, b) => a.type - b.type);

    setTiles(newTiles);
    setSlot(finalSlot);

    // 检查胜负
    const remainingAfter = newTiles.filter((tt) => !tt.removed).length;
    if (remainingAfter === 0) {
      // 胜利
      setPhase("won");
    } else if (finalSlot.length >= cfg.slotSize) {
      // 槽满，输
      setPhase("lost");
      onComplete(level - 1); // 已经过了的关数
    }
  };

  const advanceLevel = () => {
    const next = level + 1;
    setLevel(next);
    startLevel(next);
  };

  const restartGame = () => {
    setLevel(1);
    setPhase("idle");
    setSlot([]);
    setTiles([]);
  };

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">🎴</div>
          <h2 className="text-xl font-bold text-white">{t.tmTitle}</h2>
        </div>
        <div className="space-y-3 max-w-md mx-auto text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <span className="text-fuchsia-400 font-bold flex-shrink-0">1.</span>
            <p>{t.tmTutorialStep1}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-fuchsia-400 font-bold flex-shrink-0">2.</span>
            <p>{t.tmTutorialStep2}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-fuchsia-400 font-bold flex-shrink-0">3.</span>
            <p>{t.tmTutorialStep3}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-fuchsia-400 font-bold flex-shrink-0">4.</span>
            <p>{t.tmTutorialStep4}</p>
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            {cfg.typeCount} types · {cfg.tileCount} tiles · {cfg.layerDepth} layer{cfg.layerDepth > 1 ? "s" : ""} · slot {cfg.slotSize}
          </p>
          <button className="btn-primary px-10 py-3" onClick={() => startLevel(1)}>
            {t.start}
          </button>
        </div>
      </div>
    );
  }

  // ── Won ───────────────────────────────────────────────────────────────────
  if (phase === "won") {
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <div className="text-5xl">🎉</div>
        <p className="text-green-400 text-2xl font-bold">{t.tmCleared}</p>
        <p className="text-gray-400">
          {t.level} {level}
        </p>
        <button className="btn-primary px-10 py-3" onClick={advanceLevel}>
          {t.tmNextLevel}
        </button>
      </div>
    );
  }

  // ── Lost ──────────────────────────────────────────────────────────────────
  if (phase === "lost") {
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <div className="text-5xl">❌</div>
        <p className="text-red-400 text-2xl font-bold">{t.tmSlotFull}</p>
        <p className="text-brand-400 font-bold text-lg">
          {t.tmFinalScore}: {level - 1}
        </p>
        <button className="btn-primary px-10 py-3" onClick={restartGame}>
          {t.tmRetry}
        </button>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-gray-400">
          {t.tmLevel} {level} {t.tmLevelOf}
        </span>
        <span className="text-fuchsia-400">
          {remaining} {t.tmRemaining}
        </span>
      </div>

      {/* Board (内嵌 3D 漂浮形状作为背景，牌在上层 + perspective 让牌有立体感) */}
      <div
        className="relative w-full rounded-2xl border-2 border-fuchsia-900/50 bg-gradient-to-br from-slate-900 to-purple-950 overflow-hidden select-none shadow-xl shadow-purple-900/30"
        style={{ height: 380, perspective: "1000px" }}
      >
        {/* 3D 漂浮形状层 (绝对定位铺满 board，pointer-events-none 让点击穿透到下面/上面的牌) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        >
          <TileMatchBackground />
        </div>
        {tiles.map((tile) => {
          if (tile.removed) return null;
          const covered = isCoveredBy(tile, tiles);
          // 离地高度（每往上一层，多 6px 的 translateZ + 投影更明显）
          const elevation = Math.floor(tile.layer);
          const liftPx = 6 + elevation * 4;

          // 卡牌"厚度"—— 用 8 层堆叠的阴影模拟侧面（每层 1.5px，深色递进）
          // 这样从微微的 rotateX(8deg) 角度看，卡的底部和侧面"挤"出来一条厚度
          const thicknessLayers = covered
            ? [
                "0 1px 0 #1e293b",
                "0 2px 0 #0f172a",
                "0 3px 0 #020617",
              ]
            : [
                "0 1px 0 #f59e0b", // 第 1 层（紧贴牌面，最亮）
                "0 2px 0 #d97706",
                "0 3px 0 #b45309",
                "0 4px 0 #92400e",
                "0 5px 0 #78350f",
                "0 6px 0 #5e2a0c",
                "0 7px 0 #451a03",
                "0 8px 0 #2e1102", // 最底层（最暗，模拟卡底）
              ];

          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              disabled={covered}
              className={cn(
                "absolute w-14 h-16 rounded-lg border-2 flex items-center justify-center text-3xl transition-all duration-200",
                "[transform-style:preserve-3d]",
                covered
                  ? "border-gray-700 cursor-not-allowed"
                  : "border-amber-400/80 cursor-pointer hover:scale-105 hover:-translate-y-1.5"
              )}
              style={{
                left: `calc(${tile.x * 100}% - 28px)`,
                top: `calc(${tile.y * 100}% - 32px)`,
                zIndex: Math.floor(tile.layer * 100) + 10,
                // 牌面渐变（160deg = 从左上到右下，牌面有受光感）
                background: covered
                  ? "linear-gradient(160deg, #475569 0%, #334155 60%, #1e293b 100%)"
                  : "linear-gradient(160deg, #fffbeb 0%, #fde68a 35%, #fbbf24 80%, #d97706 100%)",
                // 总投影栈：
                // 1. 顶部高光（受光面，白线）
                // 2. 8 层卡牌厚度（侧面渐变阴影 → 看起来真的有 8px 厚）
                // 3. 板上的真实投影（floating shadow）
                boxShadow: [
                  "inset 0 2px 0 rgba(255,255,255,0.75)", // 顶光
                  ...thicknessLayers,
                  // 落在板上的柔光投影
                  `0 ${liftPx + 8}px ${liftPx * 2}px -2px rgba(0,0,0,0.55)`,
                  `0 ${liftPx / 2}px ${liftPx}px rgba(120,50,0,0.25)`,
                ].join(", "),
                // 略向后下俯视的角度（让卡的底面厚度可见）
                transform: covered
                  ? "rotateX(0deg) scale(0.94)"
                  : "rotateX(8deg) rotateY(-2deg)",
                opacity: covered ? 0.5 : 1,
              }}
            >
              <span
                className="leading-none"
                style={{
                  textShadow: covered
                    ? "none"
                    : "0 1px 0 rgba(255,255,255,0.5), 0 -1px 1px rgba(120,50,0,0.4)",
                  transform: "translateZ(2px)",
                }}
              >
                {TILE_EMOJIS[tile.type] ?? "❓"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Slot */}
      <div
        className="bg-gray-900/75 backdrop-blur-md border-2 border-fuchsia-900/50 rounded-xl p-3 shadow-xl shadow-purple-900/30"
        style={{ perspective: "800px" }}
      >
        <div className="flex items-center gap-2 justify-center">
          {Array.from({ length: cfg.slotSize }, (_, i) => {
            const tile = slot[i];
            return (
              <div
                key={i}
                className={cn(
                  "w-11 h-14 rounded-md border-2 flex items-center justify-center text-xl transition-all"
                )}
                style={
                  tile
                    ? {
                        background:
                          "linear-gradient(160deg, #fffbeb 0%, #fde68a 35%, #fbbf24 80%, #d97706 100%)",
                        borderColor: "rgba(217,119,6,0.8)",
                        boxShadow: [
                          "inset 0 2px 0 rgba(255,255,255,0.75)",
                          // 5 层缩水版的厚度（slot 里的牌小一点，少几层够了）
                          "0 1px 0 #f59e0b",
                          "0 2px 0 #d97706",
                          "0 3px 0 #b45309",
                          "0 4px 0 #92400e",
                          "0 5px 0 #78350f",
                          // 落入 slot 的投影
                          "0 7px 10px rgba(0,0,0,0.45)",
                        ].join(", "),
                        transform: "rotateX(10deg)",
                      }
                    : {
                        background: "rgba(31,41,55,0.4)",
                        borderColor: "rgba(75,85,99,0.6)",
                        borderStyle: "dashed",
                      }
                }
              >
                {tile && (
                  <span
                    className="leading-none"
                    style={{
                      textShadow:
                        "0 1px 0 rgba(255,255,255,0.5), 0 -1px 1px rgba(120,50,0,0.4)",
                    }}
                  >
                    {TILE_EMOJIS[tile.type] ?? "❓"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-[10px] text-gray-600 mt-1.5 tabular-nums">
          {slot.length} / {cfg.slotSize}
        </p>
      </div>
    </div>
  );
}
