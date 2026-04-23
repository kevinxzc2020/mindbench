"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import { AIM_TRAINER_CONFIG, type Difficulty } from "@/lib/difficulty";

const AimFpsExperience = dynamic(
  () =>
    import(
      /* webpackMode: "eager" */
      "./AimFpsExperience"
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[480px] rounded-2xl bg-gray-900 flex items-center justify-center text-gray-500 text-sm">
        Loading 3D…
      </div>
    ),
  }
);

const CANVAS_ID = "aim-fps-lock";

type Phase = "idle" | "countdown" | "running" | "done";

function randomTarget3D(
  prev?: [number, number, number]
): [number, number, number] {
  const xMin = -7.2;
  const xMax = 7.2;
  const yMin = 0.82;
  const yMax = 3.05;
  const zNear = -3.6;
  const zFar = -16.2;
  let attempts = 0;
  let x: number, y: number, z: number;
  do {
    x = xMin + Math.random() * (xMax - xMin);
    y = yMin + Math.random() * (yMax - yMin);
    z = zFar + Math.random() * (zNear - zFar);
    attempts++;
  } while (
    attempts < 14 &&
    prev &&
    Math.hypot(x - prev[0], y - prev[1], (z - prev[2]) * 0.85) < 2.4
  );
  return [x, y, z];
}

export default function AimTrainerPage() {
  return (
    <GameWrapper gameId="aim-trainer">
      {(onComplete, difficulty) => (
        <AimGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
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
  const sphereRadius = cfg.sphereRadius;

  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState<number>(durationSec);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [targetPos, setTargetPos] = useState<[number, number, number] | null>(
    null
  );
  const [targetKey, setTargetKey] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [targetLifeProgress, setTargetLifeProgress] = useState(1);
  const [pointerLocked, setPointerLocked] = useState(false);

  const idRef = useRef(0);
  const gameTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const despawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lifeTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const rtRef = useRef<number[]>([]);
  const targetBornRef = useRef(0);

  const clearGameTick = () => {
    if (gameTickRef.current) clearInterval(gameTickRef.current);
  };
  const clearDespawnTimers = () => {
    if (despawnTimerRef.current) clearTimeout(despawnTimerRef.current);
    if (lifeTickRef.current) clearInterval(lifeTickRef.current);
  };

  const spawnTarget = useCallback(
    (prevPos?: [number, number, number]) => {
      clearDespawnTimers();
      const pos = randomTarget3D(prevPos);
      idRef.current += 1;
      setTargetKey(idRef.current);
      setTargetPos(pos);
      targetBornRef.current = performance.now();
      setTargetLifeProgress(1);

      if (cfg.targetLifeMs != null) {
        const life = cfg.targetLifeMs;
        const bornAt = performance.now();
        lifeTickRef.current = setInterval(() => {
          const elapsed = performance.now() - bornAt;
          setTargetLifeProgress(Math.max(0, 1 - elapsed / life));
        }, 33);
        despawnTimerRef.current = setTimeout(() => {
          missesRef.current += 1;
          setMisses((m) => m + 1);
          spawnTarget(pos);
        }, life);
      }
    },
    [cfg.targetLifeMs]
  );

  const startGame = useCallback(() => {
    setCountdown(3);
    setPhase("countdown");
    setPointerLocked(false);
    hitsRef.current = 0;
    missesRef.current = 0;
    rtRef.current = [];
    setHits(0);
    setMisses(0);
    setReactionTimes([]);
    setTimeLeft(durationSec);
    setTargetPos(null);

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
            setTargetPos(null);
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

  const onHitTarget = useCallback(() => {
    if (!targetPos) return;
    const rt = performance.now() - targetBornRef.current;
    rtRef.current = [...rtRef.current, rt];
    setReactionTimes((prev) => [...prev, rt]);
    hitsRef.current += 1;
    setHits((h) => h + 1);
    spawnTarget(targetPos);
  }, [spawnTarget, targetPos]);

  const onMissShot = useCallback(() => {
    missesRef.current += 1;
    setMisses((m) => m + 1);
  }, []);

  const totalAttempts = hits + misses;
  const accuracy =
    totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;
  const avgRt =
    reactionTimes.length > 0
      ? Math.round(
          reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        )
      : 0;

  const requestCanvasLock = () => {
    const el = document.getElementById(CANVAS_ID);
    el?.requestPointerLock();
  };

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
              setTargetPos(null);
              setReactionTimes([]);
              setPointerLocked(false);
            }}
          >
            {t.aimRestart}
          </button>
        </div>
      </div>
    );
  }

  const progress = (durationSec - timeLeft) / durationSec;
  const hasLifeLimit = cfg.targetLifeMs != null;
  const difficultyNote = hasLifeLimit
    ? `${durationSec}s · 3D · r≈${sphereRadius.toFixed(2)} · ${(cfg.targetLifeMs! / 1000).toFixed(1)}s despawn`
    : `${durationSec}s · 3D · r≈${sphereRadius.toFixed(2)}`;

  const showFpsView = phase === "countdown" || phase === "running";
  const fallbackPos: [number, number, number] = [-4, 1.8, -10];

  return (
    <div className="space-y-4">
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

      {/* 固定高度：子级 h-full / R3F resize 才能拿到正确 clientHeight，否则会只渲染上半屏 */}
      <div className="relative h-[clamp(420px,62vh,720px)] w-full rounded-2xl overflow-hidden bg-gray-950 ring-1 ring-gray-800">
        {phase === "idle" && (
          <button
            type="button"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-white bg-gray-900/80"
            onClick={startGame}
          >
            <span className="text-5xl">🎯</span>
            <span className="text-xl font-bold">{t.aimClickToStart}</span>
            <span className="text-sm text-gray-400 max-w-md text-center px-4">
              {t.aimInstruction}
            </span>
            <span className="text-xs text-gray-500 mt-2">{difficultyNote}</span>
          </button>
        )}

        {showFpsView && (
          <>
            <div className="absolute inset-0 z-0">
              <AimFpsExperience
                active={phase === "running"}
                pointerLocked={pointerLocked}
                onPointerLockChange={setPointerLocked}
                canvasId={CANVAS_ID}
                sphereRadius={sphereRadius}
                targetId={targetKey}
                targetPosition={targetPos ?? fallbackPos}
                targetLifeProgress={targetLifeProgress}
                hasLifeLimit={hasLifeLimit}
                onHit={onHitTarget}
                onMiss={onMissShot}
              />
            </div>

            {phase === "countdown" && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 pointer-events-none">
                <span className="text-8xl font-black text-cyan-400 animate-bounce-in">
                  {countdown}
                </span>
              </div>
            )}

            {phase === "running" && !pointerLocked && (
              <button
                type="button"
                className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/65 text-white px-6"
                onClick={(e) => {
                  e.stopPropagation();
                  requestCanvasLock();
                }}
              >
                <span className="text-lg font-semibold">{t.aimLockCursor}</span>
                <span className="text-sm text-gray-400">{t.aimEscHint}</span>
              </button>
            )}

            {phase === "running" && pointerLocked && (
              <div
                className="pointer-events-none absolute inset-0 z-20"
                aria-hidden
              >
                <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative h-7 w-7">
                    <div className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    <div className="absolute left-1/2 top-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
