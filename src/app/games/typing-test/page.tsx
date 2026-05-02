"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import { TYPING_TEST_CONFIG, type Difficulty } from "@/lib/difficulty";
import { TYPING_PASSAGES } from "@/lib/typing-passages";
import { Keyboard } from "lucide-react";

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

  // 注意：不要用 ref 跟踪 isComposing 状态 —— 切换输入法会让 compositionend
  // 不触发，导致 ref 永远卡在 true。改成每个事件自带的 `e.nativeEvent.isComposing`
  // 属性，浏览器在事件触发时实时给值，不会有"残留状态"。
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
          // 显示和提交对齐，避免「屏幕 50，榜上 49」的尴尬
          setWpm(finalWpm);
          // 0 分不提交（用户点了 start 但没打字 —— 不污染排行榜）
          if (finalWpm > 0) onComplete(finalWpm);
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
    // 切语言时也换一篇 passage —— 否则可能在新语言池里反复抽到同一篇
    setPassage(Math.floor(Math.random() * passagePool.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (phase !== "running") return;
    // 用本次事件自带的 isComposing 标志判断是否在拼音/中日韩 IME 组合中。
    // 这个属性跟事件一起来，不会因为切换输入法而残留。
    const ne = e.nativeEvent as InputEvent;
    if (ne.isComposing) return;
    commitText(e.target.value);
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLTextAreaElement>
  ) => {
    // composition 结束时 commit 一次，兜底（某些浏览器在 compositionend
    // 之后不会再发一次 input 事件）。
    if (phase !== "running") return;
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
      // 0 分不提交（理论上完成全文 WPM 不会是 0，但还是兜底一下）
      if (finalWpm > 0) onComplete(finalWpm);
    }
  };

  const totalChars = typed.length;
  const correctChars = typed
    .split("")
    .filter((ch, i) => ch === target[i]).length;
  // 0 字时显示「—」而不是 100% 或 0%（test 中和 done 屏统一行为）
  const accuracyDisplay =
    totalChars > 0
      ? `${Math.round((correctChars / totalChars) * 100)}%`
      : "—";
  const progress = timeLeft / durationSec;

  if (phase === "done") {
    const finalCorrect = typed
      .split("")
      .filter((ch, i) => ch === target[i]).length;
    // 跟测试中一致：0 字时显示「—」
    const finalAccDisplay =
      typed.length > 0
        ? `${Math.round((finalCorrect / typed.length) * 100)}%`
        : "—";
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="card p-8 text-center space-y-5">
          <Keyboard size={56} strokeWidth={1.8} className="mx-auto text-emerald-400" />
          <p className="text-2xl font-extrabold text-white">{t.typeDone}</p>
          <div className="py-2">
            <p className="text-7xl font-black text-emerald-400 tabular-nums">
              {wpm}
            </p>
            <p className="text-gray-400 text-sm mt-1">WPM</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{finalAccDisplay}</p>
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
          <p className="text-xl font-bold tabular-nums">{accuracyDisplay}</p>
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
        className="card p-6 font-mono text-lg leading-loose cursor-text select-none min-h-[10rem]"
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
          onCompositionEnd={handleCompositionEnd}
          disabled={phase === "idle"}
          className={cn(
            "w-full rounded-xl p-4 font-mono text-base bg-gray-800 border border-gray-700 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
            phase === "idle" ? "opacity-60 cursor-not-allowed" : ""
          )}
          rows={5}
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
            <Keyboard size={36} strokeWidth={1.8} className="text-emerald-400" />
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
