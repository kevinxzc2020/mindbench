"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";

// CPS Test 不走难度体系 —— 它本身就是个纯粹的速度测试，
// 所以保留经典的 5/10/15 秒时长选择，分数统一归 medium 档存榜。

const DURATIONS = [5, 10, 15] as const;
type Duration = (typeof DURATIONS)[number];
type Phase = "idle" | "running" | "done";

export default function CpsTestPage() {
  return (
    <GameWrapper gameId="cps-test" noDifficulty>
      {(onComplete) => <CpsGame onComplete={onComplete} />}
    </GameWrapper>
  );
}

function CpsGame({ onComplete }: { onComplete: (score: number) => void }) {
  const { t } = useLang();
  const [duration, setDuration] = useState<Duration>(10);
  const [phase, setPhase] = useState<Phase>("idle");
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [peakCps, setPeakCps] = useState(0);

  const clickTimestamps = useRef<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const latestClicks = useRef(0);
  const latestPeak = useRef(0);

  const clearTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startGame = useCallback(() => {
    setClicks(0);
    setTimeLeft(duration);
    setPeakCps(0);
    clickTimestamps.current = [];
    latestClicks.current = 0;
    latestPeak.current = 0;
    startTimeRef.current = performance.now();
    setPhase("running");

    intervalRef.current = setInterval(() => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      const now = performance.now();
      const recent = clickTimestamps.current.filter((ts) => now - ts <= 1000);
      const currentPeak = Math.max(latestPeak.current, recent.length);
      latestPeak.current = currentPeak;
      setPeakCps(currentPeak);

      if (remaining <= 0) {
        clearTick();
        setPhase("done");
        const finalCps = parseFloat(
          (latestClicks.current / duration).toFixed(2)
        );
        onComplete(finalCps);
      }
    }, 50);
  }, [duration, onComplete]);

  const handleDurationChange = (d: Duration) => {
    clearTick();
    setDuration(d);
    setPhase("idle");
    setClicks(0);
    setTimeLeft(d);
    setPeakCps(0);
  };

  useEffect(() => () => clearTick(), []);
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  const handleClick = () => {
    if (phase === "idle") {
      startGame();
      return;
    }
    if (phase !== "running") return;

    const now = performance.now();
    clickTimestamps.current.push(now);
    const newClicks = latestClicks.current + 1;
    latestClicks.current = newClicks;
    setClicks(newClicks);
  };

  const elapsed = duration - timeLeft;
  const cps = elapsed > 0 ? clicks / elapsed : 0;
  const progress = elapsed / duration;

  const durationLabel: Record<Duration, string> = {
    5: t.cpsDuration5,
    10: t.cpsDuration10,
    15: t.cpsDuration15,
  };

  const buttonGlow =
    cps >= 12 ? "shadow-pink-500/60"
    : cps >= 8  ? "shadow-rose-400/50"
    : cps >= 4  ? "shadow-orange-400/40"
    : "shadow-brand-600/30";

  if (phase === "done") {
    const finalCps = (clicks / duration).toFixed(2);
    return (
      <div className="space-y-6">
        <div className="card p-8 text-center space-y-5 animate-fade-in">
          <div className="text-5xl">🖱️</div>
          <p className="text-2xl font-extrabold text-white">{t.cpsDone}</p>

          <div className="py-4">
            <p className="text-7xl font-black text-rose-400 tabular-nums">
              {finalCps}
            </p>
            <p className="text-gray-400 text-sm mt-1">CPS</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{clicks}</p>
              <p className="text-xs text-gray-400 mt-1">{t.cpsClicks}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-rose-300">{peakCps}</p>
              <p className="text-xs text-gray-400 mt-1">{t.cpsPeak}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{duration}s</p>
              <p className="text-xs text-gray-400 mt-1">{t.cpsTime}</p>
            </div>
          </div>

          <button
            className="btn-primary w-full py-3"
            onClick={() => {
              setPhase("idle");
              setClicks(0);
              setTimeLeft(duration);
              setPeakCps(0);
            }}
          >
            {t.cpsRestart}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Duration selector (only when idle) */}
      {phase === "idle" && (
        <div className="card p-4 space-y-3">
          <p className="text-sm text-gray-400 font-medium">{t.cpsSelectDuration}</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => handleDurationChange(d)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                  duration === d
                    ? "bg-rose-600 text-white"
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
          className={cn(
            "h-full rounded-full transition-all",
            phase === "running" ? "bg-rose-500" : "bg-gray-600"
          )}
          style={{
            width:
              phase === "running" ? `${(1 - progress) * 100}%` : "100%",
            transition: phase === "running" ? "width 0.05s linear" : "none",
          }}
        />
      </div>

      {/* Live stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums">
            {timeLeft.toFixed(1)}s
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t.cpsTime}</p>
        </div>
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums text-rose-400">
            {cps.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">CPS</p>
        </div>
        <div className="card p-3">
          <p className="text-xl font-bold tabular-nums">{clicks}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t.cpsClicks}</p>
        </div>
      </div>

      {/* Main click area */}
      <button
        onClick={handleClick}
        className={cn(
          "w-full rounded-2xl font-extrabold text-white select-none focus:outline-none transition-all duration-75",
          "active:scale-[0.97]",
          phase === "idle"
            ? "h-64 bg-rose-600 hover:bg-rose-500 text-2xl shadow-lg shadow-rose-600/30"
            : `h-64 bg-gradient-to-br from-rose-500 to-pink-600 text-3xl shadow-2xl ${buttonGlow}`
        )}
      >
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          {phase === "idle" ? (
            <>
              <span className="text-4xl">🖱️</span>
              <span>{t.cpsClickToStart}</span>
              <span className="text-sm font-normal text-white/70">{t.cpsInstruction}</span>
            </>
          ) : (
            <>
              <span className="text-5xl font-black tabular-nums">{clicks}</span>
              <span className="text-base font-semibold text-white/80">
                {t.cpsClicking}
              </span>
            </>
          )}
        </div>
      </button>

      {/* CPS indicator bar */}
      {phase === "running" && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>CPS</span>
            <span>20</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-100"
              style={{ width: `${Math.min(100, (cps / 20) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
