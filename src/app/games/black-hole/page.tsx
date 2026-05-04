"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import { BLACK_HOLE_CONFIG } from "@/lib/difficulty";
import { cn } from "@/lib/utils";
import { Aperture, Loader2, Sparkles } from "lucide-react";

// R3F scene 客户端动态加载，避免 SSR 报错
const BlackHoleScene = dynamic(() => import("./BlackHoleScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video rounded-2xl bg-gray-900 flex items-center justify-center text-gray-500 text-sm">
      Loading 3D scene…
    </div>
  ),
});

type Phase = "idle" | "running" | "done";
type RendererMode = "checking" | "godot" | "threejs";

// 探测 public/godot-hole/index.html 是否存在
// 决定走哪个渲染路径。
//
// 历史包袱：曾尝试用 Godot 4 导出 HTML5（含真 CSG 挖洞 + warp shader），
// 但开源 Hole.io 模板视觉太简陋（4 球 + 4 方块 + 灰地面 + 36MB wasm 加载时间），
// Three.js 版做了 9 种建筑（灌木/树/汽车/电话亭/小屋/商店/摩天楼/电视塔/消防栓）
// 撒在 80×80 世界，视觉丰富 10 倍。所以默认走 Three.js。
//
// 想切回 Godot 版：把 `USE_GODOT` 改成 true，前提是 public/godot-hole/index.html 存在。
const USE_GODOT = true;

function useGodotAvailability(): RendererMode {
  const [mode, setMode] = useState<RendererMode>(USE_GODOT ? "checking" : "threejs");
  useEffect(() => {
    if (!USE_GODOT) return;
    let alive = true;
    fetch("/godot-hole/index.html", { method: "HEAD" })
      .then((res) => {
        if (!alive) return;
        setMode(res.ok ? "godot" : "threejs");
      })
      .catch(() => {
        if (alive) setMode("threejs");
      });
    return () => {
      alive = false;
    };
  }, []);
  return mode;
}

// Godot HTML5 导出 iframe 嵌入
//
// 关键 UX 问题：iframe 默认拿不到键盘焦点 —— 用户按方向键时浏览器以为是
// "想滚动页面"，输入根本传不到 Godot。
// 解决方案：
//   1) iframe 一加载完就主动 focus 它的 contentWindow（同源 OK）
//   2) 鼠标进入或点击时再 focus 一次（兜底）
//   3) iframe 拿到焦点期间，阻止方向键的页面滚动默认行为
function GodotEmbed() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const focusGame = useCallback(() => {
    iframeRef.current?.contentWindow?.focus();
  }, []);

  // 当焦点在 iframe 时，方向键应该传给 Godot 而不是滚动页面
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 只拦截方向键，且仅当 iframe 当前是 active document
      if (
        document.activeElement === iframeRef.current &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="rounded-2xl overflow-hidden border-2 border-purple-900/50 shadow-xl shadow-purple-900/30 aspect-video bg-black cursor-pointer"
      onClick={focusGame}
      onMouseEnter={focusGame}
    >
      <iframe
        ref={iframeRef}
        src="/godot-hole/index.html"
        className="w-full h-full block"
        style={{ border: "none" }}
        // SharedArrayBuffer 需要 cross-origin isolated；如果 Godot 导出勾了 Threads，
        // 需要在 next.config 加 COOP/COEP 头。这里不强制要求。
        allow="cross-origin-isolated; fullscreen; gamepad"
        // tabIndex 让 iframe 本身可以被 Tab 键 focus，无障碍友好
        tabIndex={0}
        onLoad={focusGame}
      />
    </div>
  );
}

export default function BlackHolePage() {
  return (
    <GameWrapper gameId="black-hole" noDifficulty>
      {(onComplete) => <BlackHoleGame onComplete={onComplete} />}
    </GameWrapper>
  );
}

function BlackHoleGame({ onComplete }: { onComplete: (score: number) => void }) {
  const { t } = useLang();
  const cfg = BLACK_HOLE_CONFIG;
  const renderer = useGodotAvailability();

  const [phase, setPhase] = useState<Phase>("idle");
  const [mass, setMass] = useState(cfg.startMass);
  const [timeLeft, setTimeLeft] = useState<number>(cfg.durationSec);
  const [runKey, setRunKey] = useState(0);
  const finalMassRef = useRef(cfg.startMass);

  // Hooks MUST be declared before any conditional returns (Rules of Hooks).
  const startGame = useCallback(() => {
    setMass(cfg.startMass);
    setTimeLeft(cfg.durationSec);
    finalMassRef.current = cfg.startMass;
    setRunKey((k) => k + 1);
    setPhase("running");
  }, [cfg.startMass, cfg.durationSec]);

  const handleGameEnd = useCallback(
    (final: number) => {
      finalMassRef.current = final;
      setPhase("done");
      onComplete(final);
    },
    [onComplete]
  );

  // ── Godot 模式：iframe 替代整个游戏 ──────────────────────────────────────
  if (renderer === "checking") {
    return (
      <div className="card p-12 text-center space-y-3">
        <Loader2 size={32} className="mx-auto animate-spin text-gray-500" />
        <p className="text-sm text-gray-400">Detecting renderer…</p>
      </div>
    );
  }
  if (renderer === "godot") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
          <span>Powered by Godot 4 · Hole.io clone</span>
          <span className="text-purple-400">↑↓←→ to move · embedded</span>
        </div>
        <GodotEmbed />
        <p className="text-center text-xs text-gray-600">
          Godot WebAssembly version. Rendering doesn't go through Three.js.
        </p>
      </div>
    );
  }

  // ── Idle / Tutorial ────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="card p-8 space-y-6">
        <div className="text-center space-y-2">
          <Aperture size={72} strokeWidth={1.8} className="mx-auto text-purple-400" />
          <h2 className="text-xl font-bold text-white">{t.bhTitle}</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            {t.bhInstruction}
          </p>
        </div>
        <div className="space-y-3 max-w-md mx-auto text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold flex-shrink-0">1.</span>
            <p>{t.bhTutorialStep1}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold flex-shrink-0">2.</span>
            <p>{t.bhTutorialStep2}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold flex-shrink-0">3.</span>
            <p>{t.bhTutorialStep3}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold flex-shrink-0">4.</span>
            <p>{t.bhTutorialStep4}</p>
          </div>
        </div>
        <div className="text-center">
          <button className="btn-primary px-10 py-3" onClick={startGame}>
            {t.start}
          </button>
        </div>
      </div>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="card p-8 text-center space-y-5">
          <Sparkles size={56} strokeWidth={1.8} className="mx-auto text-purple-400" />
          <p className="text-2xl font-extrabold text-white">{t.bhFinalMass}</p>
          <p className="text-7xl font-black text-purple-400 tabular-nums">
            {finalMassRef.current}
          </p>
          <p className="text-sm text-gray-500">{t.bhMassUnit}</p>
          <button
            className="btn-primary w-full py-3"
            onClick={() => setPhase("idle")}
          >
            {t.restart}
          </button>
        </div>
      </div>
    );
  }

  // ── Running ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* HUD */}
      <div className="flex items-center justify-between text-sm font-semibold">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{t.bhMass}:</span>
          <span className="text-2xl font-black tabular-nums text-purple-400">
            {mass}
          </span>
          <span className="text-xs text-gray-500">{t.bhMassUnit}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{t.bhTimeLeft}:</span>
          <span
            className={cn(
              "text-2xl font-black tabular-nums",
              timeLeft < 10 ? "text-red-400 animate-pulse" : "text-white"
            )}
          >
            {timeLeft.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* 3D scene */}
      <div className="rounded-2xl overflow-hidden border-2 border-purple-900/50 shadow-xl shadow-purple-900/30 h-[540px]">
        <BlackHoleScene
          key={runKey}
          initialMass={cfg.startMass}
          durationSec={cfg.durationSec}
          spawnRate={cfg.spawnRate}
          buildingCount={cfg.objectCount}
          massDistribution={cfg.massDistribution}
          onMassUpdate={setMass}
          onTimeUpdate={setTimeLeft}
          onGameEnd={handleGameEnd}
        />
      </div>

      <p className="text-center text-xs text-gray-600">
        Move your mouse to steer the hole · objects fall in when consumed
      </p>
    </div>
  );
}
