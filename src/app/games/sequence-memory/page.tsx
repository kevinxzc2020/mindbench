"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import { SEQUENCE_MEMORY_CONFIG, type Difficulty } from "@/lib/difficulty";

type Phase = "idle" | "showing" | "input" | "correct" | "wrong";

export default function SequenceMemoryPage() {
  return (
    <GameWrapper gameId="sequence-memory">
      {(onComplete, difficulty) => (
        <SequenceMemoryGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function SequenceMemoryGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = SEQUENCE_MEMORY_CONFIG[difficulty];
  const GRID_SIZE = cfg.gridSize * cfg.gridSize;

  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const playSequence = useCallback(
    async (seq: number[]) => {
      setPhase("showing");
      setHighlighted(null);
      await new Promise((r) => setTimeout(r, 600));
      for (const cell of seq) {
        setHighlighted(cell);
        await new Promise((r) => setTimeout(r, cfg.flashMs));
        setHighlighted(null);
        await new Promise((r) => setTimeout(r, cfg.gapMs));
      }
      setPhase("input");
    },
    [cfg]
  );

  const startRound = useCallback(
    (lvl: number, existingSeq: number[] = []) => {
      // On first round of a new game, seed with startLen cells.
      // On subsequent rounds, just append one cell.
      let newSeq: number[];
      if (existingSeq.length === 0) {
        newSeq = Array.from({ length: cfg.startLen }, () =>
          Math.floor(Math.random() * GRID_SIZE)
        );
      } else {
        newSeq = [...existingSeq, Math.floor(Math.random() * GRID_SIZE)];
      }
      setSequence(newSeq);
      setUserSequence([]);
      setWrongCell(null);
      playSequence(newSeq);
    },
    [playSequence, cfg.startLen, GRID_SIZE]
  );

  const handleCellClick = (idx: number) => {
    if (phase !== "input") return;
    const newUserSeq = [...userSequence, idx];
    const pos = newUserSeq.length - 1;
    if (sequence[pos] !== idx) {
      setWrongCell(idx);
      setPhase("wrong");
      onComplete(level);
      return;
    }
    setUserSequence(newUserSeq);
    if (newUserSeq.length === sequence.length) setPhase("correct");
  };

  const nextLevel = () => {
    const next = level + 1;
    setLevel(next);
    startRound(next, sequence);
  };

  const restart = () => {
    setLevel(1);
    startRound(1, []);
  };

  if (phase === "idle") {
    return (
      <div className="card p-10 text-center space-y-6">
        <div className="text-6xl">🧩</div>
        <h2 className="text-xl font-bold">{t.smTitle}</h2>
        <p className="text-gray-400 max-w-xs mx-auto">{t.smInstruction}</p>
        <p className="text-xs text-gray-500">
          {cfg.gridSize}×{cfg.gridSize} grid · starts with {cfg.startLen}
        </p>
        <button
          className="btn-primary px-10 py-3"
          onClick={restart}
        >
          {t.start}
        </button>
      </div>
    );
  }

  if (phase === "wrong") {
    return (
      <div className="card p-10 text-center space-y-5">
        <div className="text-5xl">❌</div>
        <p className="text-red-400 text-xl font-bold">{t.smWrong}</p>
        <p className="text-brand-400 font-bold text-lg">
          {t.finalScore} {level}
        </p>
        <button
          className="btn-primary px-10 py-3"
          onClick={restart}
        >
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
        <p className="text-gray-400">
          {t.smLevel} {level} {t.smCorrectDesc}
        </p>
        <button className="btn-primary px-10 py-3" onClick={nextLevel}>
          {t.nextLevel}
        </button>
      </div>
    );
  }

  // Grid width class depends on size
  const maxWidth =
    cfg.gridSize === 3
      ? "max-w-sm"
      : cfg.gridSize === 4
      ? "max-w-md"
      : "max-w-xl";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-400">
          {phase === "showing"
            ? t.smShowing
            : `${t.smLevel} ${level} — ${t.smInput} (${userSequence.length}/${sequence.length})`}
        </p>
      </div>

      <div
        className={`grid gap-3 ${maxWidth} mx-auto`}
        style={{ gridTemplateColumns: `repeat(${cfg.gridSize}, 1fr)` }}
      >
        {Array.from({ length: GRID_SIZE }, (_, i) => {
          const isHighlighted = highlighted === i;
          const isWrong = wrongCell === i;
          return (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              disabled={phase !== "input"}
              className={cn(
                "aspect-square rounded-xl border-2 transition-all duration-150 focus:outline-none",
                isHighlighted
                  ? "bg-purple-400 border-purple-300 scale-110 shadow-lg shadow-purple-500/50"
                  : isWrong
                  ? "bg-red-500 border-red-400"
                  : phase === "input"
                  ? "bg-gray-800 border-gray-700 hover:bg-purple-900/50 hover:border-purple-700 cursor-pointer"
                  : "bg-gray-800 border-gray-700"
              )}
            />
          );
        })}
      </div>

      <div className="text-center text-xs text-gray-500">
        {t.smLevel} {level} · {t.smSeqLen} {sequence.length}
      </div>
    </div>
  );
}
