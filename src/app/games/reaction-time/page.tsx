"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";

type Phase = "idle" | "waiting" | "ready" | "clicked" | "tooEarly";

export default function ReactionTimePage() {
  return (
    <GameWrapper gameId="reaction-time">
      {(onComplete) => <ReactionGame onComplete={onComplete} />}
    </GameWrapper>
  );
}

function ReactionGame({ onComplete }: { onComplete: (score: number) => void }) {
  const { t } = useLang();
  const [phase, setPhase] = useState<Phase>("idle");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startWaiting = useCallback(() => {
    setPhase("waiting");
    setReactionTime(null);
    const delay = 1500 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setPhase("ready");
      startRef.current = performance.now();
    }, delay);
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const handleClick = () => {
    if (phase === "idle" || phase === "clicked" || phase === "tooEarly") {
      startWaiting();
      return;
    }
    if (phase === "waiting") {
      clearTimer();
      setPhase("tooEarly");
      return;
    }
    if (phase === "ready") {
      const rt = Math.round(performance.now() - startRef.current);
      setReactionTime(rt);
      const newAttempts = [...attempts, rt];
      setAttempts(newAttempts);
      setPhase("clicked");
      if (newAttempts.length >= 5) {
        const avg = Math.round(newAttempts.reduce((a, b) => a + b, 0) / newAttempts.length);
        onComplete(avg);
      }
    }
  };

  const bgColor =
    phase === "waiting" ? "bg-red-600 hover:bg-red-500" :
    phase === "ready" ? "bg-green-500 hover:bg-green-400" :
    phase === "tooEarly" ? "bg-yellow-500 hover:bg-yellow-400" :
    "bg-brand-600 hover:bg-brand-500";

  const message =
    phase === "idle" ? t.rtClickToStart :
    phase === "waiting" ? t.rtWaiting :
    phase === "ready" ? t.rtNow :
    phase === "tooEarly" ? t.rtTooEarly :
    reactionTime !== null ? `${reactionTime} ms` : "";

  const subMessage =
    phase === "clicked"
      ? `${t.rtContinueHint}${5 - attempts.length}${t.rtContinueHint2}`
      : phase === "tooEarly" ? t.rtTooEarlyHint : "";

  return (
    <div className="space-y-6">
      <div className="card p-4 text-center text-sm text-gray-400">
        {t.rtInstruction} <strong className="text-white">5</strong> {t.rtInstructionEnd}
      </div>

      <button
        onClick={handleClick}
        className={`w-full h-72 rounded-2xl font-bold text-white text-3xl transition-all duration-100 focus:outline-none select-none ${bgColor}`}
      >
        <div>{message}</div>
        {subMessage && <div className="text-base font-normal mt-2 text-white/70">{subMessage}</div>}
      </button>

      {attempts.length > 0 && (
        <div className="card p-4">
          <p className="text-sm text-gray-400 mb-3">{t.rtAttempts}</p>
          <div className="flex gap-2 flex-wrap">
            {attempts.map((ms, i) => (
              <span key={i} className="bg-gray-800 px-3 py-1 rounded-lg text-sm font-mono text-brand-300">
                #{i + 1}: {ms} ms
              </span>
            ))}
            {attempts.length >= 2 && (
              <span className="bg-brand-900/50 border border-brand-700 px-3 py-1 rounded-lg text-sm font-mono text-brand-300">
                {t.rtAvg}: {Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)} ms
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
