"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import { Bird, PartyPopper, CircleX, Hand, Tv2, Plus } from "lucide-react";
import { scrollToGameArea } from "@/lib/utils";

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

// ── 渐进式关卡配置表 ────────────────────────────────────────────────────────
// 约束：tileCount = typeCount × k，k 必须是 3 的倍数，typeCount ≤ 8
// 所有关卡 slotSize 固定 6（第 7 / 8 格看广告解锁）
//
// 天降机制：场景内部有 CONTAINER_CAPACITY=48 的上限；超出的物品在队列里，
// 每捡走一个就从天上补进来一个。
const LEVEL_CONFIGS = [
  { typeCount: 7, tileCount:  21, slotSize: 6 }, // 关 1  全在容器里
  { typeCount: 8, tileCount:  24, slotSize: 6 }, // 关 2  全在容器里
  { typeCount: 8, tileCount:  48, slotSize: 6 }, // 关 3  塞满容器
  { typeCount: 8, tileCount:  72, slotSize: 6 }, // 关 4  24 个天降
  { typeCount: 8, tileCount:  96, slotSize: 6 }, // 关 5  48 个天降
] as const;

const MAX_EXTRA_SLOTS = 2; // 最多看 2 次广告 → 最多 8 槽
const AD_DURATION_SEC = 5; // 模拟广告时长（秒）

function getLevelCfg(level: number) {
  const idx = Math.min(level - 1, LEVEL_CONFIGS.length - 1);
  return LEVEL_CONFIGS[idx];
}

type Phase = "idle" | "playing" | "won" | "lost";

// ── 模拟广告 Modal ──────────────────────────────────────────────────────────
function AdModal({ onClose }: { onClose: () => void }) {
  const [countdown, setCountdown] = useState(AD_DURATION_SEC);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (countdown <= 0) { setDone(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="card p-8 max-w-sm w-full mx-4 text-center space-y-5 animate-fade-in">
        <Tv2 size={48} strokeWidth={1.6} className="mx-auto text-yellow-400" />
        {!done ? (
          <>
            <p className="text-white font-bold text-lg">广告播放中…</p>
            <p className="text-gray-400 text-sm">（真实广告接入后会在这里播放）</p>
            {/* Mock ad progress bar */}
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
                style={{ width: `${((AD_DURATION_SEC - countdown) / AD_DURATION_SEC) * 100}%` }}
              />
            </div>
            <p className="text-yellow-400 font-mono text-2xl font-black tabular-nums">
              {countdown}s
            </p>
            <p className="text-xs text-gray-600">观看完成即可获得额外槽位</p>
          </>
        ) : (
          <>
            <p className="text-green-400 font-bold text-xl">+1 存储槽位已解锁！</p>
            <p className="text-gray-400 text-sm">感谢观看，好运！</p>
            <button className="btn-primary w-full py-3" onClick={onClose}>
              继续游戏
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── 广告解锁按钮（放在 bag 标题旁） ────────────────────────────────────────
function AdUnlockButton({
  extraSlots,
  onWatch,
}: {
  extraSlots: number;
  onWatch: () => void;
}) {
  if (extraSlots >= MAX_EXTRA_SLOTS) return null;
  return (
    <button
      onClick={onWatch}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
                 bg-gradient-to-br from-yellow-500 to-amber-600 text-black
                 hover:scale-105 active:scale-95 shadow-md shadow-yellow-500/30 transition-all"
      title="看广告解锁额外槽位"
    >
      <Tv2 size={12} strokeWidth={2.4} />
      <Plus size={10} strokeWidth={3} />
      1 槽
    </button>
  );
}

// ── 主页 ─────────────────────────────────────────────────────────────────────
export default function GooseGrabPage() {
  return (
    <GameWrapper gameId="goose-grab" noDifficulty>
      {(onComplete) => <GooseGrabGame onComplete={onComplete} />}
    </GameWrapper>
  );
}

function GooseGrabGame({ onComplete }: { onComplete: (score: number) => void }) {
  const { t } = useLang();

  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [itemsLeft, setItemsLeft] = useState(0);
  const [bagTypes, setBagTypes] = useState<number[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [runKey, setRunKey] = useState(0);

  // 广告解锁的额外槽位（持久到本局结束）
  const [extraSlots, setExtraSlots] = useState(0);
  const [showAd, setShowAd] = useState(false);

  const cfg = useMemo(() => getLevelCfg(level), [level]);
  const { typeCount, tileCount: totalItems } = cfg;
  const bagCapacity = cfg.slotSize + extraSlots; // 有效槽位

  const startLevel = useCallback((lvl: number) => {
    setItemsLeft(getLevelCfg(lvl).tileCount);
    setBagTypes([]);
    setRunKey((k) => k + 1);
    setPhase("playing");
  }, []);

  const handleWin = useCallback(() => setPhase("won"), []);

  const handleLose = useCallback(() => {
    setPhase("lost");
    onComplete(level - 1);
  }, [level, onComplete]);

  const handleShake = () => setShakeKey((k) => k + 1);

  const advanceLevel = () => {
    const next = level + 1;
    setLevel(next);
    startLevel(next);
    scrollToGameArea();
  };

  const restart = () => {
    setLevel(1);
    setExtraSlots(0);
    setPhase("idle");
    scrollToGameArea();
  };

  // 广告看完后 +1 槽
  const handleAdClose = () => {
    setExtraSlots((e) => Math.min(e + 1, MAX_EXTRA_SLOTS));
    setShowAd(false);
  };

  // ── Idle ───────────────────────────────────────────────────────────────
  if (phase === "idle") {
    const c1 = getLevelCfg(1);
    return (
      <div className="card p-8 space-y-6">
        <div className="text-center space-y-2">
          <Bird size={72} strokeWidth={1.8} className="mx-auto text-orange-400" />
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
        <p className="text-center text-xs text-gray-500 inline-flex items-center justify-center gap-1.5 w-full">
          关 1：{c1.typeCount} 种食物 · {c1.tileCount} 件 · 槽 {c1.slotSize} ·
          <Hand size={12} strokeWidth={2.4} className="inline" /> ∞ 次摇晃
        </p>
        <p className="text-center text-xs text-orange-500/70">
          关 3 起物品会从天上掉进来，越来越多
        </p>
        <p className="text-center text-xs text-yellow-600">
          <Tv2 size={11} className="inline mr-1" />
          槽位不够？看广告解锁第 7 / 第 8 格
        </p>
        <div className="text-center">
          <button className="btn-primary px-10 py-3" onClick={() => startLevel(1)}>{t.start}</button>
        </div>
      </div>
    );
  }

  if (phase === "won") {
    const next = getLevelCfg(level + 1);
    const isHarder =
      next.typeCount > cfg.typeCount || next.tileCount > cfg.tileCount;
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <PartyPopper size={56} strokeWidth={1.8} className="mx-auto text-green-400" />
        <p className="text-green-400 text-2xl font-bold">{t.tmCleared}</p>
        <p className="text-gray-400">{t.level} {level}</p>
        {isHarder && (
          <p className="text-xs text-orange-400">
            关 {level + 1}：{next.typeCount} 种 · {next.tileCount} 件 · 槽 {next.slotSize + extraSlots}
          </p>
        )}
        <button className="btn-primary px-10 py-3" onClick={advanceLevel}>{t.tmNextLevel}</button>
      </div>
    );
  }

  if (phase === "lost") {
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <CircleX size={56} strokeWidth={1.8} className="mx-auto text-red-400" />
        <p className="text-red-400 text-2xl font-bold">{t.tmSlotFull}</p>
        <p className="text-brand-400 font-bold text-lg">{t.tmFinalScore}: {level - 1}</p>
        <button className="btn-primary px-10 py-3" onClick={restart}>{t.tmRetry}</button>
      </div>
    );
  }

  // ── Playing ─────────────────────────────────────────────────────────────
  return (
    <>
      {showAd && <AdModal onClose={handleAdClose} />}

      <div className="space-y-3">
        {/* HUD */}
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-400">{t.tmLevel} {level} · {itemsLeft} 剩</span>
          <button
            onClick={handleShake}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold bg-gradient-to-br from-orange-500 to-red-600 text-white hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/40 transition-all"
          >
            <Hand size={14} strokeWidth={2.4} />
            {t.ggShakeBtn}
          </button>
          <span className="text-orange-400">槽 {bagTypes.length} / {bagCapacity}</span>
        </div>

        {/* 3D scene */}
        <div className="rounded-2xl overflow-hidden border-2 border-orange-900/50 shadow-xl shadow-orange-900/30 h-[620px] bg-gray-900">
          <GooseGrabScene
            key={runKey}
            totalItems={totalItems}
            typeCount={typeCount}
            bagCapacity={bagCapacity}
            onWin={handleWin}
            onLose={handleLose}
            onItemsLeftChange={setItemsLeft}
            onBagItemsChange={setBagTypes}
            shakeKey={shakeKey}
          />
        </div>

        {/* 3D Bag HUD + 广告解锁按钮 */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs text-gray-500">
              Storage ({bagTypes.length}/{bagCapacity})
            </p>
            <AdUnlockButton extraSlots={extraSlots} onWatch={() => setShowAd(true)} />
          </div>
          <GooseBagDisplay types={bagTypes} capacity={bagCapacity} />
        </div>

        <p className="text-center text-xs text-gray-600">
          点击食物拾取 · 凑齐 3 个同类自动消除 · 槽位满 = 输
        </p>
      </div>
    </>
  );
}
