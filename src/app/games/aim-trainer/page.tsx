"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import { AIM_TRAINER_CONFIG, type Difficulty } from "@/lib/difficulty";

type Phase = "idle" | "countdown" | "running" | "done";

const ARENA_HEIGHT = 420;

export default function AimTrainerPage() {
  return (
    <GameWrapper gameId="aim-trainer">
      {(onComplete, difficulty) => (
        <AimGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

interface Target {
  x: number; // percent of arena width
  y: number; // percent of arena height
  id: number;
  born: number;
}

function randomPosition(
  prevX?: number,
  prevY?: number
): { x: number; y: number } {
  const margin = 8;
  let x: number, y: number;
  let attempts = 0;
  do {
    x = margin + Math.random() * (100 - 2 * margin);
    y = margin + Math.random() * (100 - 2 * margin);
    attempts++;
  } while (
    attempts < 10 &&
    prevX !== undefined &&
    prevY !== undefined &&
    Math.hypot(x - prevX, y - prevY) < 20
  );
  return { x, y };
}

function AimGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = AIM_TRAINER_CONFIG[difficulty];
  const durationSec = cfg.durationSec;

  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState<number>(durationSec);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [target, setTarget] = useState<Target | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  // Visual countdown ratio for current target life (0..1; 1 = just spawned)
  const [targetLifeProgress, setTargetLifeProgress] = useState(1);

  const idRef = useRef(0);
  const gameTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const despawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lifeTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const rtRef = useRef<number[]>([]);

  const clearGameTick = () => {
    if (gameTickRef.current) clearInterval(gameTickRef.current);
  };
  const clearDespawnTimers = () => {
    if (despawnTimerRef.current) clearTimeout(despawnTimerRef.current);
    if (lifeTickRef.current) clearInterval(lifeTickRef.current);
  };

  // Spawn a new target, scheduling auto-despawn if targetLifeMs is set
  const spawnTarget = useCallback(
    (prevX?: number, prevY?: number) => {
      clearDespawnTimers();
      const pos = randomPosition(prevX, prevY);
      idRef.current += 1;
      const newTarget: Target = {
        ...pos,
        id: idRef.current,
        born: performance.now(),
      };
      setTarget(newTarget);
      setTargetLifeProgress(1);

      if (cfg.targetLifeMs != null) {
        const life = cfg.targetLifeMs;
        const bornAt = newTarget.born;
        // Tick the progress bar smoothly
        lifeTickRef.current = setInterval(() => {
          const elapsed = performance.now() - bornAt;
          const remaining = Math.max(0, 1 - elapsed / life);
          setTargetLifeProgress(remaining);
        }, 33);
        // When life expires → count as miss and spawn next
        despawnTimerRef.current = setTimeout(() => {
          missesRef.current += 1;
          setMisses((m) => m + 1);
          spawnTarget(newTarget.x, newTarget.y);
        }, life);
      }
    },
    [cfg.targetLifeMs]
  );

  const startGame = useCallback(() => {
    setCountdown(3);
    setPhase("countdown");
    hitsRef.current = 0;
    missesRef.current = 0;
    rtRef.current = [];
    setHits(0);
    setMisses(0);
    setReactionTimes([]);
    setTimeLeft(durationSec);
    setTarget(null);

    let count = 3;
    const cdInterval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(cdInterval);
        setPhase("running");
        startTimeRef.current = performance.now();
        spawnTarget();

        gameTickRef.current = setInterval(() => {
          const elapsed =
            (performance.now() - startTimeRef.current) / 1000;
          const remaining = Math.max(0, durationSec - elapsed);
          setTimeLeft(remaining);
          if (remaining <= 0) {
            clearGameTick();
            clearDespawnTimers();
            setTarget(null);
            setPhase("done");
            onComplete(hitsRef.current);
          }
        }, 50);
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [durationSec, onComplete, spawnTarget]);

  useEffect(
    () => () => {
      clearGameTick();
      clearDespawnTimers();
    },
    []
  );
  useEffect(() => {
    setTimeLeft(durationSec);
  }, [durationSec]);

  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phase !== "running" || !target) return;
    const rt = performance.now() - target.born;
    rtRef.current = [...rtRef.current, rt];
    setReactionTimes((prev) => [...prev, rt]);
    hitsRef.current += 1;
    setHits((h) => h + 1);
    spawnTarget(target.x, target.y);
  };

  const handleArenaClick = () => {
    if (phase !== "running") return;
    missesRef.current += 1;
    setMisses((m) => m + 1);
  };

  const totalAttempts = hits + misses;
  const accuracy =
    totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;
  const avgRt =
    reactionTimes.length > 0
      ? Math.round(
          reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        )
      : 0;

  if (phase === "done") {
    const finalAccuracy =
      totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="card p-8 text-center space-y-5">
          <div className="text-5xl">🎯</div>
          <p className="text-2xl font-extrabold text-white">{t.aimDone}</p>
          <div className="py-2">
            <p className="text-7xl font-black text-cyan-400 tabular-nums">
              {hits}
            </p>
            <p className="text-gray-400 text-sm mt-1">{t.aimHits}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{finalAccuracy}%</p>
              <p className="text-xs text-gray-400 mt-1">{t.aimAccuracy}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-400">{misses}</p>
              <p className="text-xs text-gray-400 mt-1">{t.aimMisses}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-cyan-300">
                {avgRt > 0 ? `${avgRt}ms` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t.aimAvgTime}</p>
            </div>
          </div>
          <button
            className="btn-primary w-full py-3"
            onClick={() => {
              setPhase("idle");
              setHits(0);
              setMisses(0);
              setTimeLeft(durationSec);
              setTarget(null);
              setReactionTimes([]);
            }}
          >
            {t.aimRestart}
          </button>
        </div>
      </div>
    );
  }

  const progress = (durationSec - timeLeft) / durationSec;
  const diameter = cfg.targetDiameterPx;

  // Per-difficulty hint shown on idle screen
  const difficultyNote =
    cfg.targetLifeMs != null
      ? `${durationSec}s · target ${diameter}px · disappears in ${(cfg.targetLifeMs / 1000).toFixed(1)}s`
      : `${durationSec}s · target ${diameter}px`;

  return (
    <div className="space-y-4">
      {/* Timer bar */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            phase === "running" ? "bg-cyan-500" : "bg-gray-600"
          )}
          style={{
            width:
              phase === "running" ? `${(1 - progress) * 100}%` : "100%",
            transition:
              phase === "running" ? "width 0.05s linear" : "none",
          }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums">
            {phase === "running" || phase === "countdown"
              ? timeLeft.toFixed(1)
              : durationSec.toString()}
            s
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t.aimTimeLeft}</p>
        </div>
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums text-cyan-400">
            {hits}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t.aimHits}</p>
        </div>
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums">{accuracy}%</p>
          <p className="text-xs text-gray-500 mt-0.5">{t.aimAccuracy}</p>
        </div>
      </div>

      {/* Arena */}
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden select-none cursor-crosshair",
          phase === "idle" ? "bg-gray-800/60" : "bg-gray-900"
        )}
        style={{ height: ARENA_HEIGHT }}
        onClick={handleArenaClick}
      >
        {phase === "idle" && (
          <button
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white"
            onClick={(e) => {
              e.stopPropagation();
              startGame();
            }}
          >
            <span className="text-5xl">🎯</span>
            <span className="text-xl font-bold">{t.aimClickToStart}</span>
            <span className="text-sm text-gray-400">{t.aimInstruction}</span>
            <span className="text-xs text-gray-500 mt-2">
              {difficultyNote}
            </span>
          </button>
        )}

        {phase === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl font-black text-cyan-400 animate-bounce-in">
              {countdown}
            </span>
          </div>
        )}

        {phase === "running" && target && (
          <button
            key={target.id}
            onClick={handleTargetClick}
            className="absolute rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50 hover:scale-110 transition-transform duration-75 cursor-crosshair border-2 border-white/30 animate-bounce-in overflow-hidden"
            style={{
              width: diameter,
              height: diameter,
              left: `calc(${target.x}% - ${diameter / 2}px)`,
              top: `calc(${target.y}% - ${diameter / 2}px)`,
            }}
          >
            {/* Center dot */}
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-white/80" />
            </span>
            {/* Lifetime ring (only when target despawns) */}
            {cfg.targetLifeMs != null && (
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `conic-gradient(rgba(255,255,255,0.85) ${targetLifeProgress * 360}deg, transparent 0deg)`,
                  WebkitMaskImage:
                    "radial-gradient(circle, transparent 55%, black 56%)",
                  maskImage:
                    "radial-gradient(circle, transparent 55%, black 56%)",
                }}
              />
            )}
          </button>
        )}

        {(phase === "running" || phase === "countdown") && (
          <div
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        )}
      </div>
    </div>
  );
}
