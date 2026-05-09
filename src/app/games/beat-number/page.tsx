"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import type { Difficulty } from "@/lib/difficulty";
import { Sigma } from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
// maxCells: max cells per drag  target: sum needed to clear  rows/cols: grid size
// Difficulty is felt through: fewer cells + higher target + smaller grid = harder
const CFG: Record<Difficulty, { target: number; timeMs: number; maxVal: number; maxCells: number; rows: number; cols: number }> = {
  easy:   { target: 10, timeMs: 120_000, maxVal: 5, maxCells: 5, rows: 6, cols: 5 },
  medium: { target: 15, timeMs:  90_000, maxVal: 7, maxCells: 3, rows: 5, cols: 5 },
  hard:   { target: 16, timeMs:  60_000, maxVal: 9, maxCells: 2, rows: 5, cols: 5 },
  hell:   { target: 17, timeMs:  45_000, maxVal: 9, maxCells: 2, rows: 4, cols: 4 },
};

function makeGrid(maxVal: number, rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 1 + Math.floor(Math.random() * maxVal))
  );
}

function key(r: number, c: number) { return `${r},${c}`; }
function parseKey(k: string): [number, number] {
  const [r, c] = k.split(",").map(Number);
  return [r, c];
}

function isAdjacent(ar: number, ac: number, br: number, bc: number) {
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
}

/** Remove path cells from grid, apply gravity, refill top. */
function clearCells(
  grid: number[][],
  path: Array<[number, number]>,
  maxVal: number
): number[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const ng = grid.map((row) => [...row]);
  for (const [r, c] of path) ng[r][c] = 0;
  for (let c = 0; c < cols; c++) {
    const col = ng.map((row) => row[c]).filter((v) => v !== 0);
    while (col.length < rows) col.unshift(1 + Math.floor(Math.random() * maxVal));
    for (let r = 0; r < rows; r++) ng[r][c] = col[r];
  }
  return ng;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BeatNumberPage() {
  return (
    <GameWrapper gameId="beat-number">
      {(onComplete, difficulty) => (
        <BeatNumberGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

// ── Game ──────────────────────────────────────────────────────────────────────
function BeatNumberGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = CFG[difficulty];

  const [grid, setGrid] = useState<number[][]>(() => makeGrid(cfg.maxVal, cfg.rows, cfg.cols));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(cfg.timeMs);
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");

  // Path = ordered list of selected [r,c]
  const [path, setPath] = useState<Array<[number, number]>>([]);
  const isDraggingRef = useRef(false);
  const [flash, setFlash] = useState(false);

  const pathSum = path.reduce((s, [r, c]) => s + grid[r][c], 0);
  const pathSet = new Set(path.map(([r, c]) => key(r, c)));

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 100) {
          clearInterval(id);
          setPhase("done");
          return 0;
        }
        return t - 100;
      });
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "done") onComplete(score);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGame = () => {
    setGrid(makeGrid(cfg.maxVal, cfg.rows, cfg.cols));
    setScore(0);
    setTimeLeft(cfg.timeMs);
    setPath([]);
    setPhase("playing");
  };

  // ── Drag handlers ────────────────────────────────────────────────────────
  const startDrag = useCallback(
    (r: number, c: number) => {
      if (phase !== "playing") return;
      isDraggingRef.current = true;
      setPath([[r, c]]);
    },
    [phase]
  );

  const extendDrag = useCallback(
    (r: number, c: number) => {
      if (!isDraggingRef.current || phase !== "playing") return;
      setPath((prev) => {
        if (prev.length === 0) return [[r, c]];
        // Backtrack to second-to-last
        if (prev.length >= 2) {
          const [pr, pc] = prev[prev.length - 2];
          if (pr === r && pc === c) return prev.slice(0, -1);
        }
        // Already in path
        if (prev.some(([pr, pc]) => pr === r && pc === c)) return prev;
        // Must be adjacent to last
        const [lr, lc] = prev[prev.length - 1];
        if (!isAdjacent(r, c, lr, lc)) return prev;
        // Enforce max cell limit
        if (prev.length >= cfg.maxCells) return prev;
        return [...prev, [r, c]];
      });
    },
    [phase, cfg.maxCells]
  );

  // Mirror path in a ref so endDrag can read it synchronously without stale state
  const pathRef = useRef<Array<[number, number]>>([]);
  useEffect(() => { pathRef.current = path; }, [path]);

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const currentPath = pathRef.current;
    setPath([]);
    if (currentPath.length < 1) return;
    const sum = currentPath.reduce((s, [r, c]) => s + grid[r][c], 0);
    if (sum >= cfg.target) {
      setGrid((g) => clearCells(g, currentPath, cfg.maxVal));
      setScore((s) => s + sum);
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    }
  }, [grid, cfg]);

  const seconds = Math.ceil(timeLeft / 1000);

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="card p-8 space-y-6">
        <div className="text-center space-y-2">
          <Sigma size={64} strokeWidth={1.8} className="mx-auto text-green-400" />
          <h2 className="text-xl font-bold text-white">
            超越 {cfg.target}
          </h2>
        </div>
        <div className="space-y-3 max-w-md mx-auto text-sm text-gray-300">
          {[
            `格子里有数字 1–${cfg.maxVal}。`,
            `最多选 ${cfg.maxCells} 格相邻格子，总和必须 ≥ ${cfg.target} 才能消除。`,
            `格子越少、数字越大 → 选中越难，但消除得分更高。`,
            `限时 ${cfg.timeMs / 1000} 秒，尽量多消除！`,
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-green-400 font-bold flex-shrink-0">{i + 1}.</span>
              <p>{s}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button className="btn-primary px-10 py-3" onClick={startGame}>
            {t.start}
          </button>
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <Sigma size={56} strokeWidth={1.8} className="mx-auto text-green-400" />
        <p className="text-7xl font-black text-green-400 tabular-nums">{score}</p>
        <p className="text-sm text-gray-500">总消除分</p>
        <button className="btn-primary px-10 py-3" onClick={startGame}>
          {t.restart}
        </button>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-sm mx-auto select-none">
      {/* HUD */}
      <div className="flex items-center justify-between">
        <span className="text-2xl font-black text-green-400 tabular-nums">{score}</span>
        <div className="flex flex-col items-center gap-1">
          {/* Cell slots indicator */}
          <div className="flex gap-1">
            {Array.from({ length: cfg.maxCells }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-sm border transition-all duration-75 ${
                  i < path.length
                    ? pathSum >= cfg.target
                      ? "bg-green-400 border-green-300"
                      : "bg-yellow-400 border-yellow-300"
                    : "bg-gray-700 border-gray-600"
                }`}
              />
            ))}
          </div>
          {path.length > 0 && (
            <span className={`text-sm font-black tabular-nums ${pathSum >= cfg.target ? "text-green-400" : "text-gray-400"}`}>
              {pathSum} / {cfg.target}
            </span>
          )}
        </div>
        <span
          className={`text-lg font-bold tabular-nums ${seconds <= 10 ? "text-red-400 animate-pulse" : "text-gray-400"}`}
        >
          {seconds}s
        </span>
      </div>

      {/* Grid */}
      <div
        className={`card p-3 transition-all duration-150 ${flash ? "border-green-400/60 bg-green-950/20" : "border-white/10"}`}
        style={{ touchAction: "none", userSelect: "none" }}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div className="flex flex-col gap-1.5">
          {grid.map((row, r) => (
            <div key={r} className="flex gap-1.5">
              {row.map((val, c) => {
                const k = key(r, c);
                const inPath = pathSet.has(k);
                const isHead = path.length > 0 && path[path.length - 1][0] === r && path[path.length - 1][1] === c;
                return (
                  <div
                    key={c}
                    onPointerDown={(e) => { e.preventDefault(); startDrag(r, c); }}
                    onPointerEnter={() => extendDrag(r, c)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center
                      text-lg font-black cursor-pointer transition-all duration-75 ${
                        isHead
                          ? "bg-green-400 border-green-200 text-white scale-110 shadow-lg shadow-green-400/40"
                          : inPath
                          ? "bg-green-600/80 border-green-400 text-white scale-105"
                          : "bg-slate-700 border-white/10 text-white hover:border-white/30"
                      }`}
                  >
                    {val}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-600">
        最多选 {cfg.maxCells} 格 · 总和 ≥ {cfg.target} 松手消除
      </p>
    </div>
  );
}
