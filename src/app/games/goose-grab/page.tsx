"use client";

import { useState, useCallback } from "react";
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

// 3D bag display — dynamically loaded so it doesn't bloat SSR
const GooseBagDisplay = dynamic(() => import("./GooseBagDisplay"), {
  ssr: false,
  loading: () => <div className="h-20 bg-gray-900/80 rounded-xl border border-orange-900/40" />,
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

  const totalItems = Math.floor(cfg.tileCount / 3) * 3;
  const bagCapacity = cfg.slotSize;

  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [itemsLeft, setItemsLeft] = useState(totalItems);
  // bagTypes: full array of type-indices currently in the bag (for 2D HUD)
  const [bagTypes, setBagTypes] = useState<number[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [runKey, setRunKey] = useState(0);

  const isHell = difficulty === "hell";

  const startLevel = useCallback(() => {
    setItemsLeft(totalItems);
    setBagTypes([]);
    setRunKey((k) => k + 1);
    setPhase("playing");
  }, [totalItems]);

  const handleWin = useCallback(() => setPhase("won"), []);

  const handleLose = useCallback(() => {
    setPhase("lost");
    onComplete(level - 1);
  }, [level, onComplete]);

  // Shake is now unlimited — just bump shakeKey
  const handleShake = () => setShakeKey((k) => k + 1);

  const advanceLevel = () => { setLevel((l) => l + 1); startLevel(); };
  const restart = () => { setLevel(1); setPhase("idle"); };

  // ── Idle ──────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">🦢</div>
          <h2 className="text-xl font-bold text-white">{t.ggTitle}</h2>
        </div>
        <div className="space-y-3 max-w-md mx-auto text-sm text-gray-300">
          {[t.ggTutorialStep1, t.ggTutorialStep2, t.ggTutorialStep3, t.ggTutorialStep4].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-orange-400 font-bold flex-shrink-0">{i + 1}.</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-500">
          3D · {totalItems} items · slot {bagCapacity} · 🤚 ∞ shakes
        </p>
        <div className="text-center">
          <button className="btn-primary px-10 py-3" onClick={startLevel}>{t.start}</button>
        </div>
      </div>
    );
  }

  if (phase === "won") {
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <div className="text-5xl">🎉</div>
        <p className="text-green-400 text-2xl font-bold">{t.tmCleared}</p>
        <p className="text-gray-400">{t.level} {level}</p>
        <button className="btn-primary px-10 py-3" onClick={advanceLevel}>{t.tmNextLevel}</button>
      </div>
    );
  }

  if (phase === "lost") {
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <div className="text-5xl">❌</div>
        <p className="text-red-400 text-2xl font-bold">{t.tmSlotFull}</p>
        <p className="text-brand-400 font-bold text-lg">{t.tmFinalScore}: {level - 1}</p>
        <button className="btn-primary px-10 py-3" onClick={restart}>{t.tmRetry}</button>
      </div>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* HUD */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-gray-400">{t.tmLevel} {level} · {itemsLeft} 剩</span>
        <button
          onClick={handleShake}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold bg-gradient-to-br from-orange-500 to-red-600 text-white hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/40 transition-all"
        >
          🤚 {t.ggShakeBtn}
        </button>
        <span className="text-orange-400">槽 {bagTypes.length} / {bagCapacity}</span>
      </div>

      {/* 3D scene — fixed tall height so it's big enough */}
      <div className="rounded-2xl overflow-hidden border-2 border-orange-900/50 shadow-xl shadow-orange-900/30 h-[540px] bg-gray-900">
        <GooseGrabScene
          key={runKey}
          totalItems={totalItems}
          bagCapacity={bagCapacity}
          onWin={handleWin}
          onLose={handleLose}
          onItemsLeftChange={setItemsLeft}
          onBagItemsChange={setBagTypes}
          shakeKey={shakeKey}
          instantSpawn={isHell}
        />
      </div>

      {/* 3D Bag HUD — actual model thumbnails */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 text-center">
          Storage ({bagTypes.length}/{bagCapacity})
        </p>
        <GooseBagDisplay types={bagTypes} capacity={bagCapacity} />
      </div>

      <p className="text-center text-xs text-gray-600">
        点击食物拾取 · 凑齐 3 个同类自动消除 · 槽位满 = 输
      </p>
    </div>
  );
}
