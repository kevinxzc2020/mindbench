"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import type { Lang } from "@/lib/translations";

// ── Typing passages (3 per language, selected by rotation) ───────────────────

const PASSAGES: Record<Lang, string[]> = {
  en: [
    "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.",
    "Technology is best when it brings people together. The science of today is the technology of tomorrow. Innovation distinguishes between a leader and a follower.",
    "To be or not to be, that is the question. All that glitters is not gold. The course of true love never did run smooth. We know what we are but not what we may be.",
  ],
  es: [
    "El veloz murciélago hindú comía feliz cardillo y kiwi. La cigüeña tocaba el saxofón detrás del palenque de paja. Quiero comer pizza con jamón y queso.",
    "La tecnología es mejor cuando une a las personas. La ciencia de hoy es la tecnología del mañana. La innovación distingue a los líderes de los seguidores.",
    "Ser o no ser, esa es la cuestión. No todo lo que brilla es oro. El camino del verdadero amor nunca transcurrió sin dificultades. Sabemos lo que somos pero no lo que podemos ser.",
  ],
  zh: [
    "科学技术是第一生产力。知识就是力量，时间就是金钱。天才是百分之一的灵感加上百分之九十九的汗水。",
    "路漫漫其修远兮，吾将上下而求索。学而不思则罔，思而不学则殆。三人行，必有我师焉。",
    "人生最重要的不是我们站在哪里，而是我们朝哪个方向移动。失败是成功之母。坚持就是胜利。",
  ],
};

const DURATIONS = [30, 60, 120] as const;
type Duration = (typeof DURATIONS)[number];
type Phase = "idle" | "running" | "done";

export default function TypingTestPage() {
  return (
    <GameWrapper gameId="typing-test">
      {(onComplete) => <TypingGame onComplete={onComplete} />}
    </GameWrapper>
  );
}

function TypingGame({ onComplete }: { onComplete: (score: number) => void }) {
  const { t, lang } = useLang();
  const [duration, setDuration] = useState<Duration>(60);
  const [phase, setPhase] = useState<Phase>("idle");
  const [passage, setPassage] = useState(0); // index into PASSAGES[lang]
  const [typed, setTyped] = useState(""); // committed text (post-IME)
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [wpm, setWpm] = useState(0);
  const [errors, setErrors] = useState(0);

  const isComposing = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const clearTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Derive current target text
  const target = PASSAGES[lang][passage % PASSAGES[lang].length];

  // Calculate WPM from committed typed chars vs target
  const calcWpm = useCallback((committed: string, elapsedMs: number) => {
    if (elapsedMs < 500) return 0;
    const correctChars = committed
      .split("")
      .filter((ch, i) => ch === target[i]).length;
    const words = correctChars / 5;
    const minutes = elapsedMs / 60000;
    return Math.round(words / minutes);
  }, [target]);

  const startGame = useCallback(() => {
    setTyped("");
    setErrors(0);
    setWpm(0);
    setTimeLeft(duration);
    startTimeRef.current = performance.now();
    setPhase("running");
    setTimeout(() => inputRef.current?.focus(), 50);

    intervalRef.current = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, duration * 1000 - elapsed);
      setTimeLeft(remaining / 1000);

      // Update live WPM
      setTyped((prev) => {
        setWpm(calcWpm(prev, elapsed));
        return prev;
      });

      if (remaining <= 0) {
        clearTick();
        setPhase("done");
        setTyped((prev) => {
          const finalWpm = calcWpm(prev, duration * 1000);
          onComplete(finalWpm);
          return prev;
        });
      }
    }, 200);
  }, [duration, calcWpm, onComplete]);

  useEffect(() => () => clearTick(), []);
  useEffect(() => { if (phase === "idle") setTimeLeft(duration); }, [duration, phase]);

  // When language changes mid-game, reset
  useEffect(() => {
    if (phase === "running") {
      clearTick();
      setPhase("idle");
      setTyped("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Handle textarea input — respects IME composition
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (phase !== "running" || isComposing.current) return;
    commitText(e.target.value);
  };

  const handleCompositionStart = () => { isComposing.current = true; };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposing.current = false;
    // After IME commits, grab the full textarea value
    commitText((e.target as HTMLTextAreaElement).value);
  };

  const commitText = (value: string) => {
    if (phase !== "running") return;
    // Cap at target length
    const capped = value.slice(0, target.length);
    // Count errors: positions where capped[i] !== target[i]
    let err = 0;
    for (let i = 0; i < capped.length; i++) {
      if (capped[i] !== target[i]) err++;
    }
    setErrors(err);
    setTyped(capped);

    // Auto-finish when all characters typed correctly
    if (capped === target) {
      clearTick();
      const elapsed = performance.now() - startTimeRef.current;
      const finalWpm = calcWpm(capped, elapsed);
      setWpm(finalWpm);
      setPhase("done");
      onComplete(finalWpm);
    }
  };

  const handleDurationChange = (d: Duration) => {
    clearTick();
    setDuration(d);
    setPhase("idle");
    setTyped("");
    setErrors(0);
    setWpm(0);
  };

  // ── Derived display values ───────────────────────────────────────────────────
  const totalChars = typed.length;
  const correctChars = typed.split("").filter((ch, i) => ch === target[i]).length;
  const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
  const progress = timeLeft / duration;

  const durationLabel: Record<Duration, string> = {
    30: t.typeDuration30,
    60: t.typeDuration60,
    120: t.typeDuration120,
  };

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (phase === "done") {
    const finalCorrect = typed.split("").filter((ch, i) => ch === target[i]).length;
    const finalAcc = typed.length > 0 ? Math.round((finalCorrect / typed.length) * 100) : 0;
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="card p-8 text-center space-y-5">
          <div className="text-5xl">⌨️</div>
          <p className="text-2xl font-extrabold text-white">{t.typeDone}</p>
          <div className="py-2">
            <p className="text-7xl font-black text-emerald-400 tabular-nums">{wpm}</p>
            <p className="text-gray-400 text-sm mt-1">WPM</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{finalAcc}%</p>
              <p className="text-xs text-gray-400 mt-1">{t.typeAccuracy}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-emerald-300">{finalCorrect}</p>
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
              setTimeLeft(duration);
              setPassage((p) => (p + 1) % PASSAGES[lang].length);
            }}
          >
            {t.typeRestart}
          </button>
        </div>
      </div>
    );
  }

  // ── Idle / Running ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Duration selector (idle only) */}
      {phase === "idle" && (
        <div className="card p-4 space-y-3">
          <p className="text-sm text-gray-400 font-medium">{t.typeSelectDuration}</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => handleDurationChange(d)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                  duration === d
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                )}
              >
                {durationLabel[d]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timer bar */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", phase === "running" ? "bg-emerald-500" : "bg-gray-600")}
          style={{ width: phase === "running" ? `${progress * 100}%` : "100%", transition: phase === "running" ? "width 0.2s linear" : "none" }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums">{timeLeft.toFixed(0)}s</p>
          <p className="text-xs text-gray-500 mt-0.5">{t.typeTimeLeft}</p>
        </div>
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums text-emerald-400">{wpm}</p>
          <p className="text-xs text-gray-500 mt-0.5">WPM</p>
        </div>
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums">{accuracy}%</p>
          <p className="text-xs text-gray-500 mt-0.5">{t.typeAccuracy}</p>
        </div>
        <div className="card p-3">
          <p className={cn("text-xl font-bold tabular-nums", errors > 0 ? "text-red-400" : "text-white")}>{errors}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t.typeErrors}</p>
        </div>
      </div>

      {/* Passage display */}
      <div
        className="card p-5 font-mono text-base leading-relaxed cursor-text select-none"
        onClick={() => { if (phase === "running") inputRef.current?.focus(); }}
      >
        {target.split("").map((ch, i) => {
          let color = "text-gray-500"; // upcoming
          if (i < typed.length) {
            color = typed[i] === ch ? "text-emerald-400" : "text-red-400";
          } else if (i === typed.length) {
            color = "text-white"; // cursor position
          }
          return (
            <span key={i} className={cn(color, i === typed.length ? "underline decoration-brand-400" : "")}>
              {ch}
            </span>
          );
        })}
      </div>

      {/* Textarea (hidden behind the styled display, but focused) */}
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
          placeholder={phase === "idle" ? t.typeClickToStart : t.typeInstruction}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {/* Start overlay button */}
        {phase === "idle" && (
          <button
            className="absolute inset-0 rounded-xl bg-gray-900/70 flex flex-col items-center justify-center gap-2 hover:bg-gray-900/50 transition-colors"
            onClick={startGame}
          >
            <span className="text-3xl">⌨️</span>
            <span className="font-bold text-white">{t.typeClickToStart}</span>
            <span className="text-sm text-gray-400">{t.typeInstruction}</span>
          </button>
        )}
      </div>
    </div>
  );
}
