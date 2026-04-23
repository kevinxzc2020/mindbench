"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import { TYPING_TEST_CONFIG, type Difficulty } from "@/lib/difficulty";
import { TYPING_PASSAGES } from "@/lib/typing-passages";

type Phase = "idle" | "running" | "done";

export default function TypingTestPage() {
  return (
    <GameWrapper gameId="typing-test">
      {(onComplete, difficulty) => (
        <TypingGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function TypingGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t, lang } = useLang();
  const cfg = TYPING_TEST_CONFIG[difficulty];
  const durationSec = cfg.durationSec;
  const passagePool = TYPING_PASSAGES[cfg.passageTier][lang];

  const [phase, setPhase] = useState<Phase>("idle");
  // Start at a random passage so different attempts feel fresh
  const [passage, setPassage] = useState(() =>
    Math.floor(Math.random() * passagePool.length)
  );
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(durationSec);
  const [wpm, setWpm] = useState(0);
  const [errors, setErrors] = useState(0);

  const isComposing = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const clearTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const target = passagePool[passage % passagePool.length];

  const calcWpm = useCallback(
    (committed: string, elapsedMs: number) => {
      if (elapsedMs < 500) return 0;
      const correctChars = committed
        .split("")
        .filter((ch, i) => ch === target[i]).length;
      const words = correctChars / 5;
      const minutes = elapsedMs / 60000;
      return Math.round(words / minutes);
    },
    [target]
  );

  const startGame = useCallback(() => {
    setTyped("");
    setErrors(0);
    setWpm(0);
    setTimeLeft(durationSec);
    startTimeRef.current = performance.now();
    setPhase("running");
    setTimeout(() => inputRef.current?.focus(), 50);

    intervalRef.current = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, durationSec * 1000 - elapsed);
      setTimeLeft(remaining / 1000);

      setTyped((prev) => {
        setWpm(calcWpm(prev, elapsed));
        return prev;
      });

      if (remaining <= 0) {
        clearTick();
        setPhase("done");
        setTyped((prev) => {
          const finalWpm = calcWpm(prev, durationSec * 1000);
          onComplete(finalWpm);
          return prev;
        });
      }
    }, 200);
  }, [durationSec, calcWpm, onComplete]);

  useEffect(() => () => clearTick(), []);
  useEffect(() => {
    if (phase === "idle") setTimeLeft(durationSec);
  }, [durationSec, phase]);

  // When language changes mid-game, reset
  useEffect(() => {
    if (phase === "running") {
      clearTick();
      setPhase("idle");
      setTyped("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (phase !== "running" || isComposing.current) return;
    commitText(e.target.value);
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLTextAreaElement>
  ) => {
    isComposing.current = false;
    commitText((e.target as HTMLTextAreaElement).value);
  };

  const commitText = (value: string) => {
    if (phase !== "running") return;
    const capped = value.slice(0, target.length);
    let err = 0;
    for (let i = 0; i < capped.length; i++) {
      if (capped[i] !== target[i]) err++;
    }
    setErrors(err);
    setTyped(capped);

    if (capped === target) {
      clearTick();
      const elapsed = performance.now() - startTimeRef.current;
      const finalWpm = calcWpm(capped, elapsed);
      setWpm(finalWpm);
      setPhase("done");
      onComplete(finalWpm);
    }
  };

  const totalChars = typed.length;
  const correctChars = typed
    .split("")
    .filter((ch, i) => ch === target[i]).length;
  const accuracy =
    totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
  const progress = timeLeft / durationSec;

  if (phase === "done") {
    const finalCorrect = typed
      .split("")
      .filter((ch, i) => ch === target[i]).length;
    const finalAcc =
      typed.length > 0 ? Math.round((finalCorrect / typed.length) * 100) : 0;
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="card p-8 text-center space-y-5">
          <div className="text-5xl">⌨️</div>
          <p className="text-2xl font-extrabold text-white">{t.typeDone}</p>
          <div className="py-2">
            <p className="text-7xl font-black text-emerald-400 tabular-nums">
              {wpm}
            </p>
            <p className="text-gray-400 text-sm mt-1">WPM</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{finalAcc}%</p>
              <p className="text-xs text-gray-400 mt-1">{t.typeAccuracy}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-emerald-300">
                {finalCorrect}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t.typeChars}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-400">{errors}</p>
              <p className="text-xs text-gray-400 mt-1">{t.typeErrors}</p>
            </div>
          </div>
          <button
            className="btn-primary w-full py-3"
            onClick={() => {
              setPhase("idle");
              setTyped("");
              setErrors(0);
              setWpm(0);
              setTimeLeft(durationSec);
              setPassage((p) => (p + 1) % passagePool.length);
            }}
          >
            {t.typeRestart}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timer bar */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            phase === "running" ? "bg-emerald-500" : "bg-gray-600"
          )}
          style={{
            width:
              phase === "running" ? `${progress * 100}%` : "100%",
            transition:
              phase === "running" ? "width 0.2s linear" : "none",
          }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums">
            {timeLeft.toFixed(0)}s
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t.typeTimeLeft}</p>
        </div>
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums text-emerald-400">
            {wpm}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">WPM</p>
        </div>
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums">{accuracy}%</p>
          <p className="text-xs text-gray-500 mt-0.5">{t.typeAccuracy}</p>
        </div>
        <div className="card p-3">
          <p
            className={cn(
              "text-xl font-bold tabular-nums",
              errors > 0 ? "text-red-400" : "text-white"
            )}
          >
            {errors}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t.typeErrors}</p>
        </div>
      </div>

      {/* Passage display */}
      <div
        className="card p-5 font-mono text-base leading-relaxed cursor-text select-none"
        onClick={() => {
          if (phase === "running") inputRef.current?.focus();
        }}
      >
        {target.split("").map((ch, i) => {
          let color = "text-gray-500";
          if (i < typed.length) {
            color = typed[i] === ch ? "text-emerald-400" : "text-red-400";
          } else if (i === typed.length) {
            color = "text-white";
          }
          return (
            <span
              key={i}
              className={cn(
                color,
                i === typed.length ? "underline decoration-brand-400" : ""
              )}
            >
              {ch}
            </span>
          );
        })}
      </div>

      <div className="relative">
        <textarea
          ref={inputRef}
          value={typed}
          onChange={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          disabled={phase === "idle"}
          className={cn(
            "w-full rounded-xl p-4 font-mono text-base bg-gray-800 border border-gray-700 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
            phase === "idle" ? "opacity-60 cursor-not-allowed" : ""
          )}
          rows={3}
          placeholder={
            phase === "idle" ? t.typeClickToStart : t.typeInstruction
          }
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {phase === "idle" && (
          <button
            className="absolute inset-0 rounded-xl bg-gray-900/70 flex flex-col items-center justify-center gap-2 hover:bg-gray-900/50 transition-colors"
            onClick={startGame}
          >
            <span className="text-3xl">⌨️</span>
            <span className="font-bold text-white">{t.typeClickToStart}</span>
            <span className="text-sm text-gray-400">
              {t.typeInstruction} · {durationSec}s
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
