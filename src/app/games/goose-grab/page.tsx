"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import { GOOSE_GRAB_CONFIG, type Difficulty } from "@/lib/difficulty";

// R3F 场景动态加载（避免 SSR）
const GooseGrabScene = dynamic(() => import("./GooseGrabScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video rounded-2xl bg-gray-900 flex items-center justify-center text-gray-500 text-sm">
      Loading 3D scene…
    </div>
  ),
});

type Phase = "idle" | "playing" | "won" | "lost";

export default function GooseGrabPage() {
  return (
    <GameWrapper gameId="goose-grab">
      {(onComplete, difficulty) => (
        <GooseGrabGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function GooseGrabGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = GOOSE_GRAB_CONFIG[difficulty];

  // 不同难度下的 totalItems / bagCapacity 来自现有 config（用 tileCount 做 totalItems）
  // tileCount: 24/48/72/99 → 3 的倍数化
  const totalItems = Math.floor(cfg.tileCount / 3) * 3;
  const bagCapacity = cfg.slotSize - 1; // 给 3D 版本少一个槽更紧张

  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [itemsLeft, setItemsLeft] = useState(totalItems);
  const [bagCount, setBagCount] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  // 重新 mount scene 的 key（每关一次新场景）
  const [runKey, setRunKey] = useState(0);
  const shakesLeftRef = useRef(cfg.shakeMax);
  const [shakesLeft, setShakesLeft] = useState(cfg.shakeMax);

  const startLevel = useCallback(() => {
    shakesLeftRef.current = cfg.shakeMax;
    setShakesLeft(cfg.shakeMax);
    setItemsLeft(totalItems);
    setBagCount(0);
    setRunKey((k) => k + 1);
    setPhase("playing");
  }, [cfg.shakeMax, totalItems]);

  const handleWin = useCallback(() => {
    setPhase("won");
  }, []);

  const handleLose = useCallback(() => {
    setPhase("lost");
    onComplete(level - 1);
  }, [level, onComplete]);

  const handleShake = () => {
    if (shakesLeftRef.current <= 0) return;
    shakesLeftRef.current -= 1;
    setShakesLeft(shakesLeftRef.current);
    // 只 bump shakeKey，不 bump runKey
    // → 场景不重 mount，但每个 Item 看到 shakeKey 变化会施加冲量"跳起来"
    setShakeKey((k) => k + 1);
  };

  const advanceLevel = () => {
    const next = level + 1;
    setLevel(next);
    startLevel();
  };

  const restart = () => {
    setLevel(1);
    setPhase("idle");
  };

  // ── Idle ──────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">🦢</div>
          <h2 className="text-xl font-bold text-white">{t.ggTitle}</h2>
        </div>
        <div className="space-y-3 max-w-md mx-auto text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <span className="text-orange-400 font-bold flex-shrink-0">1.</span>
            <p>{t.ggTutorialStep1}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-orange-400 font-bold flex-shrink-0">2.</span>
            <p>{t.ggTutorialStep2}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-orange-400 font-bold flex-shrink-0">3.</span>
            <p>{t.ggTutorialStep3}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-orange-400 font-bold flex-shrink-0">4.</span>
            <p>{t.ggTutorialStep4}</p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500">
          3D 物理版 · {totalItems} 件食物 · slot {bagCapacity} · 🤚 {cfg.shakeMax} shakes
        </p>
        <div className="text-center">
          <button className="btn-primary px-10 py-3" onClick={startLevel}>
            {t.start}
          </button>
        </div>
      </div>
    );
  }

  // ── Won ────────────────────────────────────────────────────────────────
  if (phase === "won") {
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <div className="text-5xl">🎉</div>
        <p className="text-green-400 text-2xl font-bold">{t.tmCleared}</p>
        <p className="text-gray-400">
          {t.level} {level}
        </p>
        <button className="btn-primary px-10 py-3" onClick={advanceLevel}>
          {t.tmNextLevel}
        </button>
      </div>
    );
  }

  // ── Lost ───────────────────────────────────────────────────────────────
  if (phase === "lost") {
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <div className="text-5xl">❌</div>
        <p className="text-red-400 text-2xl font-bold">{t.tmSlotFull}</p>
        <p className="text-brand-400 font-bold text-lg">
          {t.tmFinalScore}: {level - 1}
        </p>
        <button className="btn-primary px-10 py-3" onClick={restart}>
          {t.tmRetry}
        </button>
      </div>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* HUD */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-gray-400">
          {t.tmLevel} {level} · {itemsLeft} 剩
        </span>
        <button
          onClick={handleShake}
          disabled={shakesLeft <= 0}
          className={
            shakesLeft > 0
              ? "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold bg-gradient-to-br from-orange-500 to-red-600 text-white hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/40 transition-all"
              : "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold bg-gray-700 text-gray-500 cursor-not-allowed"
          }
        >
          🤚 {t.ggShakeBtn} ({shakesLeft})
        </button>
        <span className="text-orange-400">
          槽 {bagCount} / {bagCapacity}
        </span>
      </div>

      {/* 3D scene */}
      <div
        className="rounded-2xl overflow-hidden border-2 border-orange-900/50 shadow-xl shadow-orange-900/30 aspect-video bg-gray-900"
      >
        <GooseGrabScene
          key={runKey}
          totalItems={totalItems}
          bagCapacity={bagCapacity}
          onWin={handleWin}
          onLose={handleLose}
          onItemsLeftChange={setItemsLeft}
          onBagItemsChange={setBagCount}
          shakeKey={shakeKey}
        />
      </div>

      <p className="text-center text-xs text-gray-600">
        点击食物拾取 · 凑齐 3 个同类自动消除 · 槽位满 = 输
      </p>
    </div>
  );
}
