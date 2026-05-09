"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import type { Difficulty } from "@/lib/difficulty";
import { Grid3X3 } from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const CFG: Record<Difficulty, { size: number; newVals: number[] }> = {
  easy:   { size: 5, newVals: [1] },
  medium: { size: 5, newVals: [1, 1, 2] },
  hard:   { size: 4, newVals: [1, 2] },
  hell:   { size: 4, newVals: [1, 2, 3] },
};

// ── Grid helpers ──────────────────────────────────────────────────────────────
type Grid = number[][];
type Dir = "left" | "right" | "up" | "down";

function emptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

/** Slide one row left, merge same adjacent tiles (same val → val+1).
 *  Returns merged output indices (positions in the result row that are merges). */
function slideRowLeft(row: number[]): { row: number[]; score: number; mergedOutIdx: number[] } {
  const nz = row.filter((x) => x !== 0);
  const out: number[] = [];
  let score = 0;
  let i = 0;
  const mergedOutIdx: number[] = [];
  while (i < nz.length) {
    if (i + 1 < nz.length && nz[i] === nz[i + 1]) {
      const merged = nz[i] + 1;
      mergedOutIdx.push(out.length);
      out.push(merged);
      score += merged;
      i += 2;
    } else {
      out.push(nz[i]);
      i++;
    }
  }
  while (out.length < row.length) out.push(0);
  return { row: out, score, mergedOutIdx };
}

function slideGrid(g: Grid, dir: Dir): { grid: Grid; score: number; moved: boolean; mergedPos: Array<[number, number]> } {
  const size = g.length;
  const ng = g.map((r) => [...r]);
  let total = 0;
  let moved = false;
  const mergedPos: Array<[number, number]> = [];

  if (dir === "left" || dir === "right") {
    for (let r = 0; r < size; r++) {
      const rev = dir === "right";
      const row = rev ? [...ng[r]].reverse() : [...ng[r]];
      const orig = [...row];
      const { row: slid, score, mergedOutIdx } = slideRowLeft(row);
      total += score;
      if (slid.some((v, i) => v !== orig[i])) moved = true;
      ng[r] = rev ? [...slid].reverse() : slid;
      // Map output indices to actual columns
      for (const idx of mergedOutIdx) {
        const c = rev ? size - 1 - idx : idx;
        mergedPos.push([r, c]);
      }
    }
  } else {
    for (let c = 0; c < size; c++) {
      const rev = dir === "down";
      const col = Array.from({ length: size }, (_, r) => ng[r][c]);
      const arr = rev ? [...col].reverse() : [...col];
      const orig = [...arr];
      const { row: slid, score, mergedOutIdx } = slideRowLeft(arr);
      total += score;
      if (slid.some((v, i) => v !== orig[i])) moved = true;
      const final = rev ? [...slid].reverse() : slid;
      for (let r = 0; r < size; r++) ng[r][c] = final[r];
      // Map output indices to actual rows
      for (const idx of mergedOutIdx) {
        const r = rev ? size - 1 - idx : idx;
        mergedPos.push([r, c]);
      }
    }
  }
  return { grid: ng, score: total, moved, mergedPos };
}

function addRandomTile(g: Grid, vals: number[]): Grid {
  const empty: [number, number][] = [];
  for (let r = 0; r < g.length; r++)
    for (let c = 0; c < g[r].length; c++)
      if (g[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return g;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const ng = g.map((row) => [...row]);
  ng[r][c] = vals[Math.floor(Math.random() * vals.length)];
  return ng;
}

function hasValidMoves(g: Grid): boolean {
  const size = g.length;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (g[r][c] === 0) return true;
      if (c + 1 < size && g[r][c] === g[r][c + 1]) return true;
      if (r + 1 < size && g[r][c] === g[r + 1][c]) return true;
    }
  return false;
}

function initGrid(cfg: { size: number; newVals: number[] }): Grid {
  let g = emptyGrid(cfg.size);
  g = addRandomTile(g, cfg.newVals);
  g = addRandomTile(g, cfg.newVals);
  return g;
}

// ── Tile colors ───────────────────────────────────────────────────────────────
const TILE_STYLE: Record<number, string> = {
  0: "bg-gray-800/60 border-white/5 text-transparent",
  1: "bg-blue-600  border-blue-400  text-white",
  2: "bg-cyan-500  border-cyan-300  text-white",
  3: "bg-teal-500  border-teal-300  text-white",
  4: "bg-green-500 border-green-300 text-white",
  5: "bg-yellow-500 border-yellow-300 text-white",
  6: "bg-orange-500 border-orange-300 text-white",
};

function tileStyle(val: number) {
  if (val === 7) return "bg-gradient-to-br from-red-400 to-rose-600 border-red-300 text-white shadow-lg shadow-red-500/40 animate-pulse font-black";
  return TILE_STYLE[val] ?? "bg-purple-600 border-purple-300 text-white";
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MakeSevenPage() {
  return (
    <GameWrapper gameId="make-seven">
      {(onComplete, difficulty) => (
        <MakeSevenGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

// ── Game ──────────────────────────────────────────────────────────────────────
function MakeSevenGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = CFG[difficulty];

  const [grid, setGrid] = useState<Grid>(() => initGrid(cfg));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [phase, setPhase] = useState<"playing" | "won" | "over">("playing");
  // Track which cells just merged for pop animation
  const [mergedSet, setMergedSet] = useState<Set<string>>(new Set());
  const mergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always-fresh ref so the keyboard listener never goes stale
  const handleDirRef = useRef<(dir: Dir) => void>(() => {});

  const handleDir = useCallback(
    (dir: Dir) => {
      if (phase !== "playing") return;
      const { grid: ng, score: delta, moved, mergedPos } = slideGrid(grid, dir);
      if (!moved) return;

      const newScore = score + delta;
      setBest((b) => Math.max(b, newScore));
      setScore(newScore);

      // Trigger merge animation
      if (mergedPos.length > 0) {
        if (mergeTimerRef.current) clearTimeout(mergeTimerRef.current);
        setMergedSet(new Set(mergedPos.map(([r, c]) => `${r},${c}`)));
        mergeTimerRef.current = setTimeout(() => setMergedSet(new Set()), 230);
      }

      // Win: any tile reached 7
      if (ng.some((row) => row.some((v) => v >= 7))) {
        setGrid(ng);
        setPhase("won");
        return;
      }

      const withNew = addRandomTile(ng, cfg.newVals);
      setGrid(withNew);

      if (!hasValidMoves(withNew)) {
        setPhase("over");
        onComplete(newScore);
      }
    },
    [grid, score, phase, cfg, onComplete]
  );

  // Keep ref fresh every render
  useEffect(() => {
    handleDirRef.current = handleDir;
  });

  // Keyboard listener (registered once)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowLeft: "left", ArrowRight: "right",
        ArrowUp: "up", ArrowDown: "down",
        a: "left", d: "right", w: "up", s: "down",
      };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); handleDirRef.current(dir); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Touch / swipe
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const restart = () => {
    setGrid(initGrid(cfg));
    setScore(0);
    setPhase("playing");
  };

  const cellBase = cfg.size === 4
    ? "w-[72px] h-[72px] text-2xl sm:w-20 sm:h-20"
    : "w-[60px] h-[60px] text-xl sm:w-[68px] sm:h-[68px]";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* HUD */}
      <div className="flex gap-4">
        <div className="card px-5 py-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Score</div>
          <div className="text-2xl font-black text-white tabular-nums">{score}</div>
        </div>
        <div className="card px-5 py-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Best</div>
          <div className="text-2xl font-black text-yellow-400 tabular-nums">{best}</div>
        </div>
      </div>

      {/* Grid */}
      <div
        className="card p-3 select-none cursor-default"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStart.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          if (!touchStart.current) return;
          const dx = e.changedTouches[0].clientX - touchStart.current.x;
          const dy = e.changedTouches[0].clientY - touchStart.current.y;
          touchStart.current = null;
          if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
          if (Math.abs(dx) > Math.abs(dy)) handleDir(dx > 0 ? "right" : "left");
          else handleDir(dy > 0 ? "down" : "up");
        }}
      >
        <div className="flex flex-col gap-2">
          {grid.map((row, r) => (
            <div key={r} className="flex gap-2">
              {row.map((val, c) => (
                <div
                  key={c}
                  className={`${cellBase} rounded-xl border-2 flex items-center justify-center font-bold ${tileStyle(val)} ${mergedSet.has(`${r},${c}`) ? "tile-merge" : ""}`}
                >
                  {val > 0 ? val : ""}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* D-pad */}
      <div className="grid grid-cols-3 gap-1">
        <div />
        <button onClick={() => handleDir("up")} className="btn-ghost p-2 text-lg">↑</button>
        <div />
        <button onClick={() => handleDir("left")} className="btn-ghost p-2 text-lg">←</button>
        <button onClick={() => handleDir("down")} className="btn-ghost p-2 text-lg">↓</button>
        <button onClick={() => handleDir("right")} className="btn-ghost p-2 text-lg">→</button>
      </div>

      {/* Win overlay */}
      {phase === "won" && (
        <div className="card p-8 text-center space-y-4 animate-fade-in border-yellow-500/40 bg-yellow-950/30">
          <p className="text-5xl">🎉</p>
          <p className="text-2xl font-black text-yellow-400">合成 7 了！</p>
          <p className="text-gray-400 tabular-nums">得分：{score}</p>
          <div className="flex gap-3 justify-center">
            <button className="btn-primary" onClick={() => onComplete(score)}>提交成绩</button>
            <button className="btn-ghost" onClick={() => setPhase("playing")}>继续玩</button>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {phase === "over" && (
        <div className="card p-8 text-center space-y-4 animate-fade-in">
          <Grid3X3 size={48} className="mx-auto text-gray-500" />
          <p className="text-5xl font-black text-white tabular-nums">{score}</p>
          <p className="text-sm text-gray-500">没有更多移动了</p>
          <button className="btn-primary px-10 py-3" onClick={restart}>再来一局</button>
        </div>
      )}

      {phase === "playing" && (
        <p className="text-xs text-gray-600">箭头键 / WASD / 触摸滑动</p>
      )}
    </div>
  );
}
