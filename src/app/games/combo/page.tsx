"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import { COMBO_CONFIG, type Difficulty } from "@/lib/difficulty";
import { cn } from "@/lib/utils";

type Phase = "idle" | "showing" | "input" | "correct" | "wrong";

// Visual style per MOBA ability key.
const KEY_STYLE: Record<
  string,
  { color: string; emoji: string }
> = {
  Q: { color: "from-blue-400 to-blue-700",     emoji: "⚔️" },
  W: { color: "from-orange-400 to-orange-700", emoji: "🔥" },
  E: { color: "from-cyan-400 to-cyan-700",     emoji: "❄️" },
  R: { color: "from-purple-500 to-purple-800", emoji: "💥" },
  A: { color: "from-gray-400 to-gray-600",     emoji: "👊" },
};

export default function ComboPage() {
  return (
    <GameWrapper gameId="combo">
      {(onComplete, difficulty) => (
        <ComboGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function ComboGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = COMBO_CONFIG[difficulty];

  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState<string[]>([]);
  const [input, setInput] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  // Input timer
  const [inputTimeLeft, setInputTimeLeft] = useState<number | null>(null);
  const [inputTotal, setInputTotal] = useState(0);
  const inputDeadlineRef = useRef(0);
  const inputTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const comboLen = cfg.startLen + (level - 1);

  const clearInputTimer = () => {
    if (inputTickRef.current) {
      clearInterval(inputTickRef.current);
      inputTickRef.current = null;
    }
  };
  const clearShowTimer = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  };

  const genCombo = useCallback(
    (len: number) => {
      const arr: string[] = [];
      for (let i = 0; i < len; i++) {
        arr.push(cfg.keys[Math.floor(Math.random() * cfg.keys.length)]);
      }
      return arr;
    },
    [cfg.keys]
  );

  const startLevel = useCallback(
    (lvl: number) => {
      clearInputTimer();
      clearShowTimer();
      const len = cfg.startLen + (lvl - 1);
      const newCombo = genCombo(len);
      setCombo(newCombo);
      setInput([]);
      setHighlightIdx(null);
      setPhase("showing");

      // Sequentially highlight each key during show phase
      let i = 0;
      const stepShow = () => {
        if (i >= newCombo.length) {
          // Show phase done → input phase
          setHighlightIdx(null);
          setPhase("input");
          armInputTimer(newCombo.length);
          return;
        }
        setHighlightIdx(i);
        showTimerRef.current = setTimeout(() => {
          i++;
          stepShow();
        }, cfg.showMsPerKey);
      };
      // Small initial pause so user gets oriented
      showTimerRef.current = setTimeout(stepShow, 400);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg, genCombo]
  );

  const armInputTimer = useCallback(
    (len: number) => {
      if (cfg.inputMsPerKey == null) {
        setInputTimeLeft(null);
        setInputTotal(0);
        return;
      }
      const budget = Math.max(cfg.inputMinMs, cfg.inputMsPerKey * len);
      inputDeadlineRef.current = performance.now() + budget;
      setInputTotal(budget);
      setInputTimeLeft(budget);
      inputTickRef.current = setInterval(() => {
        const remaining = Math.max(
          0,
          inputDeadlineRef.current - performance.now()
        );
        setInputTimeLeft(remaining);
        if (remaining <= 0) {
          clearInputTimer();
          // Timeout → wrong
          setPhase("wrong");
          onComplete(level - 1); // highest level completed (before this)
        }
      }, 50);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg, level, onComplete]
  );

  // Keyboard input during input phase
  useEffect(() => {
    if (phase !== "input") return;
    const handleKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (!cfg.keys.includes(k)) return;
      e.preventDefault();
      handleKeyPress(k);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, input, combo, cfg.keys]);

  const handleKeyPress = (k: string) => {
    if (phase !== "input") return;
    const expectedKey = combo[input.length];
    const newInput = [...input, k];

    if (k !== expectedKey) {
      clearInputTimer();
      setInput(newInput);
      setPhase("wrong");
      onComplete(level - 1); // highest level completed (before this)
      return;
    }

    setInput(newInput);

    if (newInput.length === combo.length) {
      // Combo complete!
      clearInputTimer();
      setPhase("correct");
    }
  };

  const nextLevel = () => {
    const next = level + 1;
    setLevel(next);
    startLevel(next);
  };

  const restart = () => {
    setLevel(1);
    setInput([]);
    setCombo([]);
    setHighlightIdx(null);
    setPhase("idle");
  };

  useEffect(
    () => () => {
      clearInputTimer();
      clearShowTimer();
    },
    []
  );

  // ── Idle ──────────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="card p-10 text-center space-y-5">
        <div className="text-6xl">⚡</div>
        <p className="text-gray-300 max-w-sm mx-auto">{t.comboInstruction}</p>
        <div className="flex items-center justify-center gap-2">
          {cfg.keys.map((k) => (
            <KeyIcon key={k} keyId={k} size="sm" />
          ))}
        </div>
        <p className="text-xs text-gray-500">
          start length {cfg.startLen} ·{" "}
          {cfg.inputMsPerKey
            ? `input ${(cfg.inputMsPerKey / 1000).toFixed(1)}s/key`
            : "no input timer"}
        </p>
        <button
          className="btn-primary px-10 py-3"
          onClick={() => startLevel(1)}
        >
          {t.comboStart}
        </button>
      </div>
    );
  }

  // ── Showing (memorize) ────────────────────────────────────────────────────────
  if (phase === "showing") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-400">
            {t.comboLevel} {level} · {t.comboWatch}
          </p>
          <p className="text-xs text-gray-600 mt-1">{comboLen} keys</p>
        </div>

        <div className="card p-10">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {combo.map((k, i) => (
              <KeyIcon
                key={i}
                keyId={k}
                size="lg"
                dimmed={highlightIdx !== i}
                pulsing={highlightIdx === i}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Input ─────────────────────────────────────────────────────────────────────
  if (phase === "input") {
    const hasTimer = inputTimeLeft !== null && inputTotal > 0;
    const progress = hasTimer ? inputTimeLeft / inputTotal : 1;
    const urgent = hasTimer && inputTimeLeft < 1500;

    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-sm text-gray-400">
            {t.comboLevel} {level} · {t.comboInput}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {input.length} / {combo.length}
          </p>
        </div>

        {hasTimer && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-gray-500">⏱</span>
              <span
                className={cn(
                  "tabular-nums font-mono",
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
                    : "bg-yellow-500"
                )}
                style={{
                  width: `${progress * 100}%`,
                  transition: "width 0.05s linear",
                }}
              />
            </div>
          </div>
        )}

        {/* Input progress dots */}
        <div className="card p-8">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {combo.map((k, i) => {
              const typed = i < input.length;
              const correct = typed && input[i] === k;
              return (
                <KeyIcon
                  key={i}
                  keyId={k}
                  size="lg"
                  hidden={!typed}
                  success={typed && correct}
                  fail={typed && !correct}
                />
              );
            })}
          </div>
        </div>

        {/* Clickable keypad for mouse users */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {cfg.keys.map((k) => (
            <button
              key={k}
              onClick={() => handleKeyPress(k)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <KeyIcon keyId={k} size="md" />
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-600">
          Press keys on your keyboard, or click the icons above
        </p>
      </div>
    );
  }

  // ── Correct ───────────────────────────────────────────────────────────────────
  if (phase === "correct") {
    return (
      <div className="card p-10 text-center space-y-5">
        <div className="text-5xl">✅</div>
        <p className="text-green-400 text-xl font-bold">{t.comboCorrect}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {combo.map((k, i) => (
            <KeyIcon key={i} keyId={k} size="md" />
          ))}
        </div>
        <p className="text-gray-400">
          {t.comboLevel} {level}
        </p>
        <button className="btn-primary px-10 py-3" onClick={nextLevel}>
          {t.nextLevel}
        </button>
      </div>
    );
  }

  // ── Wrong / Timeout ───────────────────────────────────────────────────────────
  if (phase === "wrong") {
    const timedOut = input.length < combo.length;
    return (
      <div className="card p-10 text-center space-y-5">
        <div className="text-5xl">{timedOut ? "⏰" : "❌"}</div>
        <p className="text-red-400 text-xl font-bold">
          {timedOut ? t.comboTimedOut : t.comboWrong}
        </p>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase mb-2">
              {t.comboExpected}
            </p>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {combo.map((k, i) => (
                <KeyIcon key={i} keyId={k} size="sm" />
              ))}
            </div>
          </div>
          {input.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs uppercase mb-2">
                {t.comboYourCombo}
              </p>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {input.map((k, i) => (
                  <KeyIcon
                    key={i}
                    keyId={k}
                    size="sm"
                    success={combo[i] === k}
                    fail={combo[i] !== k}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="text-brand-400 font-bold text-lg">
          {t.finalScore} {level - 1}
        </p>
        <button className="btn-primary px-10 py-3" onClick={restart}>
          {t.restart}
        </button>
      </div>
    );
  }

  return null;
}

// ─── Key icon component ──────────────────────────────────────────────────────

function KeyIcon({
  keyId,
  size = "md",
  dimmed = false,
  pulsing = false,
  hidden = false,
  success = false,
  fail = false,
}: {
  keyId: string;
  size?: "sm" | "md" | "lg";
  dimmed?: boolean;
  pulsing?: boolean;
  hidden?: boolean;
  success?: boolean;
  fail?: boolean;
}) {
  const style = KEY_STYLE[keyId] ?? { color: "from-gray-400 to-gray-600", emoji: "?" };
  const sizeCls =
    size === "sm"
      ? "w-10 h-10 text-base"
      : size === "md"
      ? "w-14 h-14 text-xl"
      : "w-20 h-20 text-3xl";

  return (
    <div
      className={cn(
        "rounded-2xl border-2 flex flex-col items-center justify-center font-black text-white transition-all shadow-lg",
        sizeCls,
        "bg-gradient-to-br",
        style.color,
        dimmed && !pulsing && "opacity-25 grayscale",
        pulsing && "scale-110 ring-4 ring-white/60",
        success && "ring-2 ring-green-400",
        fail && "ring-2 ring-red-400 grayscale-[30%]",
        hidden && "opacity-20 blur-[1px]"
      )}
    >
      <span className="leading-none">{style.emoji}</span>
      <span
        className={cn(
          "leading-none mt-0.5 tracking-wider",
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
        )}
      >
        {keyId}
      </span>
    </div>
  );
}
