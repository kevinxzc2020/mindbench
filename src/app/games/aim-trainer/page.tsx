"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";

const DURATIONS = [15, 30, 60] as const;
type Duration = (typeof DURATIONS)[number];
type Phase = "idle" | "countdown" | "running" | "done";

// Target dimensions
const TARGET_RADIUS = 28; // px
const ARENA_HEIGHT = 420; // px

export default function AimTrainerPage() {
  return (
    <GameWrapper gameId="aim-trainer">
      {(onComplete) => <AimGame onComplete={onComplete} />}
    </GameWrapper>
  );
}

interface Target {
  x: number; // percent of arena width
  y: number; // percent of arena height
  id: number;
  born: number; // performance.now() when spawned
}

function randomTarget(prevX?: number, prevY?: number): Omit<Target, "id" | "born"> {
  const margin = 8; // % margin from edges
  let x: number, y: number;
  // Try to avoid spawning too close to previous target
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

function AimGame({ onComplete }: { onComplete: (score: number) => void }) {
  const { t } = useLang();
  const [duration, setDuration] = useState<Duration>(30);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [target, setTarget] = useState<Target | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);

  const idRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const rtRef = useRef<number[]>([]);

  const clearTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const spawnTarget = useCallback((prevX?: number, prevY?: number) => {
    const pos = randomTarget(prevX, prevY);
    idRef.current += 1;
    setTarget({ ...pos, id: idRef.current, born: performance.now() });
  }, []);

  const startGame = useCallback(() => {
    // Countdown phase
    setCountdown(3);
    setPhase("countdown");
    hitsRef.current = 0;
    missesRef.current = 0;
    rtRef.current = [];
    setHits(0);
    setMisses(0);
    setReactionTimes([]);
    setTimeLeft(duration);

    let count = 3;
    const cdInterval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(cdInterval);
        // Start running
        setPhase("running");
        startTimeRef.current = performance.now();
        spawnTarget();

        intervalRef.current = setInterval(() => {
          const elapsed = (performance.now() - startTimeRef.current) / 1000;
          const remaining = Math.max(0, duration - elapsed);
          setTimeLeft(remaining);
          if (remaining <= 0) {
            clearTick();
            setPhase("done");
            onComplete(hitsRef.current);
          }
        }, 50);
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [duration, onComplete, spawnTarget]);

  const handleDurationChange = (d: Duration) => {
    clearTick();
    setDuration(d);
    setPhase("idle");
    setTarget(null);
    setHits(0);
    setMisses(0);
    setTimeLeft(d);
    setReactionTimes([]);
  };

  useEffect(() => () => clearTick(), []);
  useEffect(() => { setTimeLeft(duration); }, [duration]);

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
  const accuracy = totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;
  const avgRt = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;

  const durationLabel: Record<Duration, string> = {
    15: t.aimDuration15,
    30: t.aimDuration30,
    60: t.aimDuration60,
  };

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (phase === "done") {
    const finalAccuracy = totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="card p-8 text-center space-y-5">
          <div className="text-5xl">🎯</div>
          <p className="text-2xl font-extrabold text-white">{t.aimDone}</p>
          <div className="py-2">
            <p className="text-7xl font-black text-cyan-400 tabular-nums">{hits}</p>
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
              <p className="text-2xl font-bold text-cyan-300">{avgRt > 0 ? `${avgRt}ms` : "—"}</p>
              <p className="text-xs text-gray-400 mt-1">{t.aimAvgTime}</p>
            </div>
          </div>
          <button
            className="btn-primary w-full py-3"
            onClick={() => { setPhase("idle"); setHits(0); setMisses(0); setTimeLeft(duration); setTarget(null); setReactionTimes([]); }}
          >
            {t.aimRestart}
          </button>
        </div>
      </div>
    );
  }

  // ── Idle / Countdown / Running ───────────────────────────────────────────────
  const progress = (duration - timeLeft) / duration;

  return (
    <div className="space-y-4">
      {/* Duration selector */}
      {phase === "idle" && (
        <div className="card p-4 space-y-3">
          <p className="text-sm text-gray-400 font-medium">{t.aimSelectDuration}</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => handleDurationChange(d)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                  duration === d
                    ? "bg-cyan-600 text-white"
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
          className={cn("h-full rounded-full transition-all", phase === "running" ? "bg-cyan-500" : "bg-gray-600")}
          style={{ width: phase === "running" ? `${(1 - progress) * 100}%` : "100%", transition: phase === "running" ? "width 0.05s linear" : "none" }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums">
            {phase === "running" || phase === "countdown" ? timeLeft.toFixed(1) : duration.toString()}s
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t.aimTimeLeft}</p>
        </div>
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums text-cyan-400">{hits}</p>
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
        {/* Idle overlay */}
        {phase === "idle" && (
          <button
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white"
            onClick={(e) => { e.stopPropagation(); startGame(); }}
          >
            <span className="text-5xl">🎯</span>
            <span className="text-xl font-bold">{t.aimClickToStart}</span>
            <span className="text-sm text-gray-400">{t.aimInstruction}</span>
          </button>
        )}

        {/* Countdown overlay */}
        {phase === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl font-black text-cyan-400 animate-bounce-in">{countdown}</span>
          </div>
        )}

        {/* Target */}
        {phase === "running" && target && (
          <button
            key={target.id}
            onClick={handleTargetClick}
            className="absolute rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50 hover:scale-110 transition-transform duration-75 cursor-crosshair border-2 border-white/30 animate-bounce-in"
            style={{
              width: TARGET_RADIUS * 2,
              height: TARGET_RADIUS * 2,
              left: `calc(${target.x}% - ${TARGET_RADIUS}px)`,
              top: `calc(${target.y}% - ${TARGET_RADIUS}px)`,
            }}
          >
            {/* Crosshair dot */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white/80" />
            </span>
          </button>
        )}

        {/* Subtle grid lines for depth */}
        {(phase === "running" || phase === "countdown") && (
          <div className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          />
        )}
      </div>
    </div>
  );
}
