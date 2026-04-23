"use client";

import { useState, useEffect, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";

type Phase = "idle" | "showing" | "input" | "correct" | "wrong";

function generateNumber(digits: number) {
  let num = "";
  for (let i = 0; i < digits; i++) {
    num += i === 0 ? String(Math.floor(Math.random() * 9) + 1) : String(Math.floor(Math.random() * 10));
  }
  return num;
}

export default function NumberMemoryPage() {
  return (
    <GameWrapper gameId="number-memory">
      {(onComplete) => <NumberMemoryGame onComplete={onComplete} />}
    </GameWrapper>
  );
}

function NumberMemoryGame({ onComplete }: { onComplete: (score: number) => void }) {
  const { t } = useLang();
  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [target, setTarget] = useState("");
  const [userInput, setUserInput] = useState("");
  const [showFor, setShowFor] = useState(2000);

  const startRound = useCallback((lvl: number) => {
    const digits = lvl + 2;
    const num = generateNumber(digits);
    const displayTime = Math.max(1000, digits * 500);
    setTarget(num);
    setUserInput("");
    setShowFor(displayTime);
    setPhase("showing");
  }, []);

  useEffect(() => {
    if (phase === "showing") {
      const timer = setTimeout(() => setPhase("input"), showFor);
      return () => clearTimeout(timer);
    }
  }, [phase, showFor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput === target) {
      setPhase("correct");
    } else {
      setPhase("wrong");
      onComplete(level);
    }
  };

  const nextLevel = () => {
    const next = level + 1;
    setLevel(next);
    startRound(next);
  };

  if (phase === "idle") {
    return (
      <div className="card p-10 text-center space-y-6">
        <div className="text-6xl">🔢</div>
        <h2 className="text-xl font-bold">{t.nmTitle}</h2>
        <p className="text-gray-400 max-w-xs mx-auto">{t.nmInstruction}</p>
        <button className="btn-primary px-10 py-3" onClick={() => { setLevel(1); startRound(1); }}>
          {t.start}
        </button>
      </div>
    );
  }

  if (phase === "showing") {
    return (
      <div className="card p-10 text-center space-y-4">
        <p className="text-sm text-gray-400">{t.level} {level} — {t.nmShowing}</p>
        <div className="text-6xl font-mono font-black tracking-widest text-white animate-fade-in">
          {target}
        </div>
        <div className="text-xs text-gray-500">{(showFor / 1000).toFixed(1)} {t.nmDisappear}</div>
      </div>
    );
  }

  if (phase === "input") {
    return (
      <form onSubmit={handleSubmit} className="card p-10 text-center space-y-6">
        <p className="text-sm text-gray-400">{t.level} {level} — {t.nmInput}</p>
        <input
          autoFocus
          type="text"
          inputMode="numeric"
          className="input text-center text-3xl font-mono tracking-widest h-16"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ""))}
          placeholder={t.nmInputPlaceholder}
        />
        <button type="submit" className="btn-primary px-10 py-3 w-full" disabled={!userInput}>
          {t.nmSubmit}
        </button>
      </form>
    );
  }

  if (phase === "correct") {
    return (
      <div className="card p-10 text-center space-y-5">
        <div className="text-5xl">✅</div>
        <p className="text-green-400 text-xl font-bold">{t.nmCorrect}</p>
        <p className="text-gray-400">{t.level} {level} {t.nmCorrectDesc}</p>
        <button className="btn-primary px-10 py-3" onClick={nextLevel}>
          {t.nextLevel}
        </button>
      </div>
    );
  }

  if (phase === "wrong") {
    return (
      <div className="card p-10 text-center space-y-5">
        <div className="text-5xl">❌</div>
        <p className="text-red-400 text-xl font-bold">{t.nmWrong}</p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-400">{t.nmAnswer}<span className="font-mono text-white">{target}</span></p>
          <p className="text-gray-400">{t.nmYours}<span className="font-mono text-red-300">{userInput}</span></p>
        </div>
        <p className="text-brand-400 font-bold text-lg">{t.finalScore} {level}</p>
        <button className="btn-primary px-10 py-3" onClick={() => { setLevel(1); startRound(1); }}>
          {t.restart}
        </button>
      </div>
    );
  }

  return null;
}
