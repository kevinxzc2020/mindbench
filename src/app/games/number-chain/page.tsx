"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import type { Difficulty } from "@/lib/difficulty";
import { Link2 } from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
// minChain: minimum chain length to score (shorter chains are silently dropped)
const CFG: Record<Difficulty, { timeMs: number; maxVal: number; spawnMax: number; rows: number; cols: number; minChain: number }> = {
  easy:   { timeMs: 90_000, maxVal: 5, spawnMax: 3, rows: 4, cols: 4, minChain: 2 },
  medium: { timeMs: 75_000, maxVal: 7, spawnMax: 3, rows: 5, cols: 5, minChain: 3 },
  hard:   { timeMs: 60_000, maxVal: 8, spawnMax: 4, rows: 5, cols: 5, minChain: 4 },
  hell:   { timeMs: 45_000, maxVal: 9, spawnMax: 4, rows: 6, cols: 6, minChain: 5 },
};

function makeGrid(rows: number, cols: number, maxVal: number): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 1 + Math.floor(Math.random() * maxVal))
  );
}

function isAdjacent(ar: number, ac: number, br: number, bc: number) {
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
}

/**
 * Apply completed chain:
 *  - Remove first n-1 cells (set to 0).
 *  - Increment last cell by 1.
 *  - Gravity: compact each column to bottom, refill top with new random tiles.
 */
function applyChain(grid: number[][], chain: Array<[number, number]>, spawnMax: number): number[][] {
  if (chain.length < 2) return grid;
  const rows = grid.length;
  const cols = grid[0].length;
  const ng = grid.map((row) => [...row]);
  for (let i = 0; i < chain.length - 1; i++) ng[chain[i][0]][chain[i][1]] = 0;
  const [lr, lc] = chain[chain.length - 1];
  ng[lr][lc] = grid[lr][lc] + 1;
  // Gravity + refill
  for (let c = 0; c < cols; c++) {
    const col = ng.map((row) => row[c]).filter((v) => v !== 0);
    while (col.length < rows) col.unshift(1 + Math.floor(Math.random() * spawnMax));
    for (let r = 0; r < rows; r++) ng[r][c] = col[r];
  }
  return ng;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NumberChainPage() {
  return (
    <GameWrapper gameId="number-chain">
      {(onComplete, difficulty) => (
        <NumberChainGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

// ── Game ──────────────────────────────────────────────────────────────────────
function NumberChainGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = CFG[difficulty];

  const [grid, setGrid] = useState<number[][]>(() => makeGrid(cfg.rows, cfg.cols, cfg.maxVal));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(cfg.timeMs);
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [chain, setChain] = useState<Array<[number, number]>>([]);
  const [flash, setFlash] = useState(false);

  const isDraggingRef = useRef(false);
  // Always reflects latest grid so drag callbacks can read it
  const gridRef = useRef(grid);
  useEffect(() => { gridRef.current = grid; }, [grid]);

  const chainSet = new Set(chain.map(([r, c]) => `${r},${c}`));
  const chainSum = chain.reduce((s, [r, c]) => s + grid[r][c], 0);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) { clearInterval(id); setPhase("done"); return 0; }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  // Call onComplete when done (score may still be updating so read it via closure)
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => {
    if (phase === "done") onComplete(scoreRef.current);
  }, [phase, onComplete]);

  const startGame = () => {
    setGrid(makeGrid(cfg.rows, cfg.cols, cfg.maxVal));
    setScore(0);
    setTimeLeft(cfg.timeMs);
    setChain([]);
    setPhase("playing");
  };

  // ── Drag handlers (pointer events) ──────────────────────────────────────
  const startDrag = useCallback((r: number, c: number) => {
    if (phase !== "playing") return;
    isDraggingRef.current = true;
    setChain([[r, c]]);
  }, [phase]);

  const extendDrag = useCallback((r: number, c: number) => {
    if (!isDraggingRef.current || phase !== "playing") return;
    setChain((prev) => {
      if (prev.length === 0) return prev;
      const [lr, lc] = prev[prev.length - 1];
      // Backtrack
      if (prev.length >= 2) {
        const [pr, pc] = prev[prev.length - 2];
        if (pr === r && pc === c) return prev.slice(0, -1);
      }
      // Already in chain
      if (prev.some(([pr, pc]) => pr === r && pc === c)) return prev;
      // Must be adjacent
      if (!isAdjacent(r, c, lr, lc)) return prev;
      // Value must be exactly last + 1
      if (gridRef.current[r][c] !== gridRef.current[lr][lc] + 1) return prev;
      return [...prev, [r, c]];
    });
  }, [phase]);

  // Mirror chain in a ref so endDrag can read it without stale state
  const chainRef2 = useRef<Array<[number, number]>>([]);
  useEffect(() => { chainRef2.current = chain; }, [chain]);

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const currentChain = chainRef2.current;
    setChain([]);
    if (currentChain.length < cfg.minChain) return;
    const sum = currentChain.reduce((s, [r, c]) => s + gridRef.current[r][c], 0);
    setGrid((g) => applyChain(g, currentChain, cfg.spawnMax));
    setScore((s) => s + sum);
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  }, [cfg]);

  const seconds = Math.ceil(timeLeft / 1000);

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="card p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link2 size={64} strokeWidth={1.8} className="mx-auto text-sky-400" />
          <h2 className="text-xl font-bold text-white">数字连线</h2>
        </div>
        <div className="space-y-3 max-w-md mx-auto text-sm text-gray-300">
          {[
            "拖动连接递增的连续数字：1→2→3→4…",
            "每一步必须相邻，且恰好加 1。",
            "松手后：链条前 n-1 格消失，最后一格 +1，上方新数字落下。",
            `连线越长得分越高！限时 ${cfg.timeMs / 1000} 秒。`,
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-sky-400 font-bold flex-shrink-0">{i + 1}.</span>
              <p>{s}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button className="btn-primary px-10 py-3" onClick={startGame}>{t.start}</button>
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <Link2 size={56} strokeWidth={1.8} className="mx-auto text-sky-400" />
        <p className="text-7xl font-black text-sky-400 tabular-nums">{score}</p>
        <p className="text-sm text-gray-500">总连线得分</p>
        <button className="btn-primary px-10 py-3" onClick={startGame}>{t.restart}</button>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-sm mx-auto select-none">
      {/* HUD */}
      <div className="flex items-center justify-between">
        <span className="text-2xl font-black text-sky-400 tabular-nums">{score}</span>
        {chain.length >= 2 && (
          <span className="text-sm font-bold text-sky-300">+{chainSum} ({chain.length}格)</span>
        )}
        <span className={`text-lg font-bold tabular-nums ${seconds <= 10 ? "text-red-400 animate-pulse" : "text-gray-400"}`}>
          {seconds}s
        </span>
      </div>

      {/* Grid */}
      <div
        className={`card p-3 transition-all duration-150 ${flash ? "border-sky-400/60 bg-sky-950/20" : "border-white/10"}`}
        style={{ touchAction: "none", userSelect: "none" }}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div className="flex flex-col gap-2">
          {grid.map((row, r) => (
            <div key={r} className="flex gap-2">
              {row.map((val, c) => {
                const inChain = chainSet.has(`${r},${c}`);
                const isHead = chain.length > 0 && chain[chain.length - 1][0] === r && chain[chain.length - 1][1] === c;
                const chainIdx = chain.findIndex(([cr, cc]) => cr === r && cc === c);
                // Highlight potential next cell
                let canExtend = false;
                if (chain.length > 0 && !inChain) {
                  const [lr, lc] = chain[chain.length - 1];
                  canExtend = isAdjacent(r, c, lr, lc) && val === grid[lr][lc] + 1;
                }
                return (
                  <div
                    key={c}
                    onPointerDown={(e) => { e.preventDefault(); startDrag(r, c); }}
                    onPointerEnter={() => extendDrag(r, c)}
                    className={`w-[52px] h-[52px] sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center
                      text-lg font-black cursor-pointer relative transition-all duration-75 ${
                        isHead
                          ? "bg-sky-400 border-sky-200 text-white scale-110 shadow-lg shadow-sky-400/40"
                          : inChain
                          ? "bg-sky-600/80 border-sky-400 text-white scale-105"
                          : canExtend
                          ? "bg-sky-900/40 border-sky-400/50 text-sky-300 ring-1 ring-sky-400/50"
                          : "bg-slate-700 border-white/10 text-white hover:border-white/30"
                      }`}
                  >
                    {val}
                    {inChain && chainIdx >= 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-300 text-sky-900 text-[9px] font-black flex items-center justify-center">
                        {chainIdx + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-600">拖动连接递增数字，松手得分</p>
    </div>
  );
}
