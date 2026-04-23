"use client";

import { useState, useEffect, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";

type Phase = "idle" | "showing" | "input" | "correct" | "wrong";

function getGridConfig(level: number) {
  if (level <= 3) return { cols: 3, count: level + 2 };
  if (level <= 7) return { cols: 4, count: level + 3 };
  return { cols: 5, count: level + 4 };
}

function sampleCells(total: number, count: number): Set<number> {
  const cells = new Set<number>();
  while (cells.size < count) cells.add(Math.floor(Math.random() * total));
  return cells;
}

export default function VisualMemoryPage() {
  return (
    <GameWrapper gameId="visual-memory">
      {(onComplete) => <VisualMemoryGame onComplete={onComplete} />}
    </GameWrapper>
  );
}

function VisualMemoryGame({ onComplete }: { onComplete: (score: number) => void }) {
  const { t } = useLang();
  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [targetCells, setTargetCells] = useState<Set<number>>(new Set());
  const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [gridCols, setGridCols] = useState(3);
  const [totalCells, setTotalCells] = useState(9);
  const MAX_MISTAKES = 3;

  const startRound = useCallback((lvl: number) => {
    const { cols, count } = getGridConfig(lvl);
    const total = cols * cols;
    const targets = sampleCells(total, count);
    setGridCols(cols);
    setTotalCells(total);
    setTargetCells(targets);
    setSelectedCells(new Set());
    setMistakes(0);
    setPhase("showing");
  }, []);

  useEffect(() => {
    if (phase === "showing") {
      const timer = setTimeout(() => setPhase("input"), 2500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleCellClick = (idx: number) => {
    if (phase !== "input" || selectedCells.has(idx)) return;
    const newSelected = new Set(selectedCells);
    newSelected.add(idx);
    setSelectedCells(newSelected);
    if (!targetCells.has(idx)) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= MAX_MISTAKES) { setPhase("wrong"); onComplete(level); return; }
    } else {
      const correctSelected = [...newSelected].filter((c) => targetCells.has(c));
      if (correctSelected.length === targetCells.size) setPhase("correct");
    }
  };

  const nextLevel = () => { const next = level + 1; setLevel(next); startRound(next); };
  const maxWidth = gridCols === 3 ? "max-w-xs" : gridCols === 4 ? "max-w-sm" : "max-w-md";

  if (phase === "idle") {
    return (
      <div className="card p-10 text-center space-y-6">
        <div className="text-6xl">👁️</div>
        <h2 className="text-xl font-bold">{t.vmTitle}</h2>
        <p className="text-gray-400 max-w-xs mx-auto">
          {t.vmInstruction} {MAX_MISTAKES} {t.vmInstructionEnd}
        </p>
        <button className="btn-primary px-10 py-3" onClick={() => { setLevel(1); startRound(1); }}>
          {t.start}
        </button>
      </div>
    );
  }

  if (phase === "wrong") {
    return (
      <div className="card p-10 text-center space-y-5">
        <div className="text-5xl">❌</div>
        <p className="text-red-400 text-xl font-bold">{t.vmWrong}</p>
        <p className="text-brand-400 font-bold text-lg">{t.finalScore} {level}</p>
        <button className="btn-primary px-10 py-3" onClick={() => { setLevel(1); startRound(1); }}>
          {t.restart}
        </button>
      </div>
    );
  }

  if (phase === "correct") {
    return (
      <div className="card p-10 text-center space-y-5">
        <div className="text-5xl">✅</div>
        <p className="text-green-400 text-xl font-bold">{t.correct}</p>
        <p className="text-gray-400">{t.level} {level} {t.vmCorrectDesc}</p>
        <button className="btn-primary px-10 py-3" onClick={nextLevel}>
          {t.nextLevel}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-400">
          {phase === "showing"
            ? t.vmShowing
            : `${t.vmInput} (${[...selectedCells].filter(c => targetCells.has(c)).length}/${targetCells.size})`}
        </p>
        {phase === "input" && (
          <div className="flex gap-1">
            {Array.from({ length: MAX_MISTAKES }, (_, i) => (
              <div key={i} className={cn("w-3 h-3 rounded-full", i < mistakes ? "bg-red-400" : "bg-gray-600")} />
            ))}
          </div>
        )}
      </div>

      <div className={`${maxWidth} mx-auto`}>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
          {Array.from({ length: totalCells }, (_, i) => {
            const isTarget = targetCells.has(i);
            const isSelected = selectedCells.has(i);
            const isCorrectSelected = isSelected && isTarget;
            const isWrongSelected = isSelected && !isTarget;
            let cellStyle = "bg-gray-800 border-gray-700 hover:bg-gray-700 cursor-pointer";
            if (phase === "showing") {
              cellStyle = isTarget ? "bg-white border-white scale-105 shadow-lg shadow-white/30" : "bg-gray-800 border-gray-700";
            } else if (phase === "input") {
              if (isCorrectSelected) cellStyle = "bg-green-500 border-green-400 cursor-default";
              else if (isWrongSelected) cellStyle = "bg-red-500 border-red-400 cursor-default";
              else cellStyle = "bg-gray-800 border-gray-700 hover:bg-gray-700 cursor-pointer";
            }
            return (
              <button key={i} onClick={() => handleCellClick(i)} disabled={phase !== "input" || isSelected}
                className={cn("aspect-square rounded-lg border-2 transition-all duration-150 focus:outline-none", cellStyle)} />
            );
          })}
        </div>
      </div>

      <div className="text-center text-xs text-gray-500">
        {t.level} {level} · {targetCells.size} {t.vmTargets} · {t.vmRemaining}{MAX_MISTAKES - mistakes} {t.vmMistakes}
      </div>
    </div>
  );
}
