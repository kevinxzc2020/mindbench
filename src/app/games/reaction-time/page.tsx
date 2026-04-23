"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import { REACTION_TIME_CONFIG, type Difficulty } from "@/lib/difficulty";

type Phase =
  | "idle"         // 开始前
  | "waiting"      // 等待中（深色背景）
  | "distractor"   // 干扰色闪现 — 千万别点
  | "green"        // 现在！快点！
  | "postGreenRed" // (hell) 绿变红了 — 点了 = 失败
  | "clicked"      // 成功（展示用时）
  | "tooEarly"     // 提前点 / 点了干扰色
  | "failedRed"    // (hell) 点在变红之后
  | "missed";      // (hell) 绿色窗口内没点，红色也没点，错过了

type DistractorColor = "yellow" | "red";

export default function ReactionTimePage() {
  return (
    <GameWrapper gameId="reaction-time">
      {(onComplete, difficulty) => (
        <ReactionGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function ReactionGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = REACTION_TIME_CONFIG[difficulty];

  const [phase, setPhase] = useState<Phase>("idle");
  const [distractorColor, setDistractorColor] =
    useState<DistractorColor | null>(null);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);

  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoMissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 本轮剩余干扰色 queue (每轮开始时重新 roll)
  const distractorsLeftRef = useRef<DistractorColor[]>([]);
  // 本轮绿色是否会变红 (每轮开始时重新 roll)
  const greenWillTurnRedRef = useRef<boolean>(false);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (autoMissRef.current) {
      clearTimeout(autoMissRef.current);
      autoMissRef.current = null;
    }
  }, []);

  // 每轮开始：掷一下骰子，决定本轮节奏
  //  - 本轮要插入几个干扰色（minDistractors..maxDistractors 均匀随机）
  //  - 每个干扰色独立从池子里随机选（所以顺序和搭配都是随机的）
  //  - hell: 本轮绿色会不会变红（按 greenTurnsRedChance）
  const rollRound = useCallback(() => {
    const { minDistractors, maxDistractors, distractorColors } = cfg;
    const count =
      minDistractors +
      Math.floor(Math.random() * (maxDistractors - minDistractors + 1));
    const distractors: DistractorColor[] = [];
    for (let i = 0; i < count; i++) {
      if (distractorColors.length === 0) break;
      distractors.push(
        distractorColors[Math.floor(Math.random() * distractorColors.length)]
      );
    }
    distractorsLeftRef.current = distractors;
    greenWillTurnRedRef.current =
      cfg.greenTurnsRedChance > 0 && Math.random() < cfg.greenTurnsRedChance;
  }, [cfg]);

  // Wait → 要么出一个干扰色然后循环，要么出绿
  const scheduleNextWait = useCallback(() => {
    const delay = cfg.waitMin + Math.random() * (cfg.waitMax - cfg.waitMin);
    timerRef.current = setTimeout(() => {
      if (distractorsLeftRef.current.length > 0) {
        const color = distractorsLeftRef.current.shift()!;
        setDistractorColor(color);
        setPhase("distractor");
        timerRef.current = setTimeout(() => {
          setDistractorColor(null);
          setPhase("waiting");
          scheduleNextWait();
        }, cfg.distractorMs);
      } else {
        // 出绿
        setPhase("green");
        startRef.current = performance.now();
        if (greenWillTurnRedRef.current) {
          timerRef.current = setTimeout(() => {
            setPhase("postGreenRed");
            autoMissRef.current = setTimeout(() => {
              setPhase("missed");
            }, 1200);
          }, cfg.greenTimeoutMs);
        }
      }
    }, delay);
  }, [cfg]);

  const startWaiting = useCallback(() => {
    clearAllTimers();
    setPhase("waiting");
    setReactionTime(null);
    setDistractorColor(null);
    rollRound();
    scheduleNextWait();
  }, [clearAllTimers, rollRound, scheduleNextWait]);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const handleClick = () => {
    if (
      phase === "idle" ||
      phase === "clicked" ||
      phase === "tooEarly" ||
      phase === "failedRed" ||
      phase === "missed"
    ) {
      startWaiting();
      return;
    }

    if (phase === "waiting" || phase === "distractor") {
      clearAllTimers();
      setPhase("tooEarly");
      setDistractorColor(null);
      return;
    }

    if (phase === "green") {
      clearAllTimers();
      const rt = Math.round(performance.now() - startRef.current);
      setReactionTime(rt);
      const newAttempts = [...attempts, rt];
      setAttempts(newAttempts);
      setPhase("clicked");
      if (newAttempts.length >= 5) {
        const avg = Math.round(
          newAttempts.reduce((a, b) => a + b, 0) / newAttempts.length
        );
        onComplete(avg);
      }
      return;
    }

    if (phase === "postGreenRed") {
      clearAllTimers();
      setPhase("failedRed");
      return;
    }
  };

  // ── Background color per phase ───────────────────────────────────────────────
  // Easy 保留经典的红色等待背景；其他难度等待用深灰，把红色留给"干扰/变红"。
  let bgColor = "bg-brand-600 hover:bg-brand-500";
  if (phase === "waiting") {
    bgColor = difficulty === "easy" ? "bg-red-600" : "bg-gray-700";
  } else if (phase === "distractor") {
    bgColor = distractorColor === "yellow" ? "bg-yellow-500" : "bg-red-600";
  } else if (phase === "green") {
    bgColor = "bg-green-500";
  } else if (phase === "postGreenRed") {
    bgColor = "bg-red-600";
  }

  // ── Message ─────────────────────────────────────────────────────────────────
  let message = "";
  let subMessage = "";
  if (phase === "idle") {
    message = t.rtClickToStart;
  } else if (phase === "waiting") {
    message = t.rtWaiting;
  } else if (phase === "distractor") {
    message = "⚠";
    subMessage = "Don't click!";
  } else if (phase === "green") {
    message = t.rtNow;
  } else if (phase === "postGreenRed") {
    message = "✗";
    subMessage = "Too slow — don't click red!";
  } else if (phase === "clicked" && reactionTime !== null) {
    message = `${reactionTime} ms`;
    subMessage = `${t.rtContinueHint}${5 - attempts.length}${t.rtContinueHint2}`;
  } else if (phase === "tooEarly") {
    message = t.rtTooEarly;
    subMessage = t.rtTooEarlyHint;
  } else if (phase === "failedRed") {
    message = "✗ RED";
    subMessage = "You clicked after green turned red.";
  } else if (phase === "missed") {
    message = "😴";
    subMessage = "Too slow — you missed the green window.";
  }

  // ── Per-difficulty hint ──────────────────────────────────────────────────────
  let diffHint = "";
  if (difficulty === "medium") {
    diffHint = "Don't click yellow — only click GREEN.";
  } else if (difficulty === "hard") {
    diffHint = "Don't click yellow or red — only click GREEN.";
  } else if (difficulty === "hell") {
    diffHint = `Chaotic: 0-${cfg.maxDistractors} random distractors, and green may turn RED in ${cfg.greenTimeoutMs}ms (~${Math.round(cfg.greenTurnsRedChance * 100)}% chance). Only click GREEN.`;
  }

  return (
    <div className="space-y-6">
      <div className="card p-4 text-center text-sm text-gray-400">
        {t.rtInstruction} <strong className="text-white">5</strong>{" "}
        {t.rtInstructionEnd}
        {diffHint && (
          <div className="mt-1 text-xs text-yellow-500/80">{diffHint}</div>
        )}
      </div>

      <button
        onClick={handleClick}
        className={`w-full h-72 rounded-2xl font-bold text-white text-3xl transition-colors duration-75 focus:outline-none select-none ${bgColor}`}
      >
        <div>{message}</div>
        {subMessage && (
          <div className="text-base font-normal mt-2 text-white/70">
            {subMessage}
          </div>
        )}
      </button>

      {attempts.length > 0 && (
        <div className="card p-4">
          <p className="text-sm text-gray-400 mb-3">{t.rtAttempts}</p>
          <div className="flex gap-2 flex-wrap">
            {attempts.map((ms, i) => (
              <span
                key={i}
                className="bg-gray-800 px-3 py-1 rounded-lg text-sm font-mono text-brand-300"
              >
                #{i + 1}: {ms} ms
              </span>
            ))}
            {attempts.length >= 2 && (
              <span className="bg-brand-900/50 border border-brand-700 px-3 py-1 rounded-lg text-sm font-mono text-brand-300">
                {t.rtAvg}:{" "}
                {Math.round(
                  attempts.reduce((a, b) => a + b, 0) / attempts.length
                )}{" "}
                ms
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
