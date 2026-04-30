"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import { NUMBER_MEMORY_CONFIG, type Difficulty } from "@/lib/difficulty";
import { cn } from "@/lib/utils";

type Phase = "idle" | "showing" | "input" | "correct" | "wrong";

function generateNumber(digits: number) {
  let num = "";
  for (let i = 0; i < digits; i++) {
    num += i === 0
      ? String(Math.floor(Math.random() * 9) + 1)
      : String(Math.floor(Math.random() * 10));
  }
  return num;
}

export default function NumberMemoryPage() {
  return (
    <GameWrapper gameId="number-memory">
      {(onComplete, difficulty) => (
        <NumberMemoryGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function NumberMemoryGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = NUMBER_MEMORY_CONFIG[difficulty];

  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(cfg.startLevel);
  const [target, setTarget] = useState("");
  const [userInput, setUserInput] = useState("");
  const [showFor, setShowFor] = useState(cfg.minMs);

  // 输入倒计时（ms）— null 表示这一档不限时
  const [inputTimeLeft, setInputTimeLeft] = useState<number | null>(null);
  const [inputTotal, setInputTotal] = useState<number>(0);
  const [timedOut, setTimedOut] = useState(false);
  const inputDeadlineRef = useRef<number>(0);
  const inputTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearInputTimer = useCallback(() => {
    if (inputTickRef.current) {
      clearInterval(inputTickRef.current);
      inputTickRef.current = null;
    }
  }, []);

  // Compute input time budget for a given digit count
  const computeInputMs = useCallback(
    (digits: number): number | null => {
      if (cfg.inputMsPerDigit == null) return null;
      return Math.max(cfg.inputMinMs, digits * cfg.inputMsPerDigit);
    },
    [cfg]
  );

  const startRound = useCallback(
    (lvl: number) => {
      const digits = lvl + 2;
      const num = generateNumber(digits);
      const displayTime = Math.max(cfg.minMs, digits * cfg.msPerDigit);
      setTarget(num);
      setUserInput("");
      setShowFor(displayTime);
      setTimedOut(false);
      clearInputTimer();
      setInputTimeLeft(null);
      setInputTotal(0);
      setPhase("showing");
    },
    [cfg, clearInputTimer]
  );

  // Show → Input transition
  useEffect(() => {
    if (phase === "showing") {
      const timer = setTimeout(() => setPhase("input"), showFor);
      return () => clearTimeout(timer);
    }
  }, [phase, showFor]);

  // When entering input phase, arm the input countdown (if this difficulty has one)
  useEffect(() => {
    if (phase !== "input") {
      clearInputTimer();
      return;
    }
    const digits = target.length;
    const budget = computeInputMs(digits);
    if (budget == null) {
      setInputTimeLeft(null);
      setInputTotal(0);
      return;
    }
    inputDeadlineRef.current = performance.now() + budget;
    setInputTotal(budget);
    setInputTimeLeft(budget);
    // Tick every 50ms for smooth bar
    inputTickRef.current = setInterval(() => {
      const remaining = Math.max(0, inputDeadlineRef.current - performance.now());
      setInputTimeLeft(remaining);
      if (remaining <= 0) {
        clearInputTimer();
        // Time's up → fail this round with whatever was typed
        setTimedOut(true);
        setPhase("wrong");
        onComplete(level);
      }
    }, 50);
    return () => clearInputTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, target, computeInputMs, level, onComplete, clearInputTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearInputTimer();
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

  const restart = () => {
    setLevel(cfg.startLevel);
    startRound(cfg.startLevel);
  };

  if (phase === "idle") {
    const inputHint =
      cfg.inputMsPerDigit == null
        ? "no input timer"
        : `input ${(cfg.inputMsPerDigit / 1000).toFixed(1)}s/digit (min ${(cfg.inputMinMs / 1000).toFixed(1)}s)`;
    return (
      <div className="card p-10 text-center space-y-6">
        <div className="text-6xl">🔢</div>
        <h2 className="text-xl font-bold">{t.nmTitle}</h2>
        <p className="text-gray-400 max-w-xs mx-auto">{t.nmInstruction}</p>
        <p className="text-xs text-gray-500">
          start {cfg.startLevel + 2}-digit · show {(cfg.minMs / 1000).toFixed(1)}s min · {inputHint}
        </p>
        <button className="btn-primary px-10 py-3" onClick={restart}>
          {t.start}
        </button>
      </div>
    );
  }

  if (phase === "showing") {
    return (
      <div className="card p-14 text-center space-y-6">
        <p className="text-sm text-gray-400">
          {t.level} {level} — {t.nmShowing}
        </p>
        <div className="text-7xl font-mono font-black tracking-widest text-white animate-fade-in py-6">
          {target}
        </div>
        <div className="text-xs text-gray-500">
          {(showFor / 1000).toFixed(1)} {t.nmDisappear}
        </div>
      </div>
    );
  }

  if (phase === "input") {
    // Countdown visuals
    const hasTimer = inputTimeLeft !== null && inputTotal > 0;
    const progress = hasTimer ? inputTimeLeft / inputTotal : 1;
    const urgent = hasTimer && inputTimeLeft < 1000; // pulse red when < 1s

    return (
      <form
        onSubmit={handleSubmit}
        className="card p-10 text-center space-y-5"
      >
        <p className="text-sm text-gray-400">
          {t.level} {level} — {t.nmInput}
        </p>

        {/* Input countdown bar (only when this difficulty has a timer) */}
        {hasTimer && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-gray-500">⏱</span>
              <span
                className={cn(
                  "tabular-nums font-mono transition-colors",
                  urgent ? "text-red-400 animate-pulse" : "text-gray-300"
                )}
              >
                {(inputTimeLeft! / 1000).toFixed(1)}s
              </span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  urgent
                    ? "bg-red-500"
                    : progress > 0.5
                    ? "bg-green-500"
                    : progress > 0.25
                    ? "bg-yellow-500"
                    : "bg-orange-500"
                )}
                style={{
                  width: `${progress * 100}%`,
                  transition: "width 0.05s linear",
                }}
              />
            </div>
          </div>
        )}

        <input
          autoFocus
          type="text"
          inputMode="numeric"
          className="input text-center text-3xl font-mono tracking-widest h-16"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ""))}
          placeholder={t.nmInputPlaceholder}
        />
        <button
          type="submit"
          className="btn-primary px-10 py-3 w-full"
          disabled={!userInput}
        >
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
        <p className="text-gray-400">
          {t.level} {level} {t.nmCorrectDesc}
        </p>
        <button className="btn-primary px-10 py-3" onClick={nextLevel}>
          {t.nextLevel}
        </button>
      </div>
    );
  }

  if (phase === "wrong") {
    return (
      <div className="card p-10 text-center space-y-5">
        <div className="text-5xl">{timedOut ? "⏰" : "❌"}</div>
        <p className="text-red-400 text-xl font-bold">
          {timedOut ? "Time's up!" : t.nmWrong}
        </p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-400">
            {t.nmAnswer}
            <span className="font-mono text-white">{target}</span>
          </p>
          <p className="text-gray-400">
            {t.nmYours}
            <span className="font-mono text-red-300">
              {userInput || "—"}
            </span>
          </p>
        </div>
        <p className="text-brand-400 font-bold text-lg">
          {t.finalScore} {level}
        </p>
        <button className="btn-primary px-10 py-3" onClick={restart}>
          {t.restart}
        </button>
      </div>
    );
  }

  return null;
}
