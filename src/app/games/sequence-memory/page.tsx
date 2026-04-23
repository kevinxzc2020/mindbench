"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { cn } from "@/lib/utils";

const GRID_SIZE = 9; // 3x3

type Phase = "idle" | "showing" | "input" | "correct" | "wrong";

export default function SequenceMemoryPage() {
  return (
    <GameWrapper gameId="sequence-memory">
      {(onComplete) => <SequenceMemoryGame onComplete={onComplete} />}
    </GameWrapper>
  );
}

function SequenceMemoryGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase("showing");
    setHighlighted(null);
    await new Promise((r) => setTimeout(r, 600));
    for (const cell of seq) {
      setHighlighted(cell);
      await new Promise((r) => setTimeout(r, 500));
      setHighlighted(null);
      await new Promise((r) => setTimeout(r, 250));
    }
    setPhase("input");
  }, []);

  const startRound = useCallback(
    (lvl: number, existingSeq: number[] = []) => {
      const next = Math.floor(Math.random() * GRID_SIZE);
      const newSeq = [...existingSeq, next];
      setSequence(newSeq);
      setUserSequence([]);
      setWrongCell(null);
      playSequence(newSeq);
    },
    [playSequence]
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

    if (newUserSeq.length === sequence.length) {
      setPhase("correct");
    }
  };

  const nextLevel = () => {
    const next = level + 1;
    setLevel(next);
    startRound(next, sequence);
  };

  if (phase === "idle") {
    return (
      <div className="card p-10 text-center space-y-6">
        <div className="text-6xl">🧩</div>
        <h2 className="text-xl font-bold">序列记忆</h2>
        <p className="text-gray-400 max-w-xs mx-auto">
          方块会依次亮起，然后你要按照相同顺序点击。每关增加一个方块。
        </p>
        <button className="btn-primary px-10 py-3" onClick={() => { setLevel(1); startRound(1); }}>
          开始
        </button>
      </div>
    );
  }

  if (phase === "wrong") {
    return (
      <div className="card p-10 text-center space-y-5">
        <div className="text-5xl">❌</div>
        <p className="text-red-400 text-xl font-bold">错误！</p>
        <p className="text-brand-400 font-bold text-lg">最终成绩：第 {level} 级</p>
        <button className="btn-primary px-10 py-3" onClick={() => { setLevel(1); startRound(1, []); }}>
          重新开始
        </button>
      </div>
    );
  }

  if (phase === "correct") {
    return (
      <div className="card p-10 text-center space-y-5">
        <div className="text-5xl">✅</div>
        <p className="text-green-400 text-xl font-bold">正确！</p>
        <p className="text-gray-400">第 {level} 级通过，序列增加一个方块</p>
        <button className="btn-primary px-10 py-3" onClick={nextLevel}>
          继续 →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-400">
          {phase === "showing" ? "观察顺序…" : `第 ${level} 级 — 按顺序点击 (${userSequence.length}/${sequence.length})`}
        </p>
      </div>

      {/* 3×3 grid */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
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

      {/* Progress */}
      <div className="text-center text-xs text-gray-500">
        第 {level} 级 · 序列长度 {sequence.length}
      </div>
    </div>
  );
}
