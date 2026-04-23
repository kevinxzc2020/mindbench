"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import { SKILL_SHOT_CONFIG, type Difficulty } from "@/lib/difficulty";
import { cn } from "@/lib/utils";

type Phase = "idle" | "running" | "done";
type PathMode = "straight" | "zigzag" | "wave" | "erratic";

// Arena dimensions (reference, displayed size scales responsively)
const ARENA_WIDTH = 640;
const ARENA_HEIGHT = 420;
const TARGET_DIAMETER = 44;

interface Shot {
  landed: boolean;
  distance: number;
}

interface PendingSkill {
  id: number;
  x: number; // click position %
  y: number;
  bornAt: number; // performance.now() when clicked
  landsAt: number; // bornAt + travelMs
}

interface ImpactFx {
  id: number;
  x: number;
  y: number;
  hit: boolean;
  // Where the target actually was at impact (for miss visualization)
  targetX: number;
  targetY: number;
}

function computeTargetPos(
  mode: PathMode,
  t: number,
  speedPctPerSec: number,
  seed: number
): { x: number; y: number } {
  const pos = (speedPctPerSec * t) / 1000;
  const margin = 10;
  const wrap = (v: number) => {
    const period = 100 - 2 * margin;
    const m = ((v % (period * 2)) + period * 2) % (period * 2);
    return margin + (m < period ? m : period * 2 - m);
  };

  switch (mode) {
    case "straight":
      return { x: wrap(pos), y: 50 };
    case "zigzag": {
      const y = 30 + 40 * (Math.floor(t / 800) % 2 === 0 ? 0 : 1);
      return { x: wrap(pos), y };
    }
    case "wave": {
      const y = 50 + 25 * Math.sin(t / 400);
      return { x: wrap(pos), y };
    }
    case "erratic": {
      const step = Math.floor(t / 500);
      let s = (seed + step * 1_000_003) >>> 0;
      s = (s ^ 0x9e3779b9) >>> 0;
      const a = ((s * 48271) % 0x7fffffff) / 0x7fffffff;
      const b = (((s * 69621) % 0x7fffffff) / 0x7fffffff + 1) / 2;
      return {
        x: margin + a * (100 - 2 * margin),
        y: margin + b * (100 - 2 * margin),
      };
    }
  }
}

export default function SkillShotPage() {
  return (
    <GameWrapper gameId="skill-shot">
      {(onComplete, difficulty) => (
        <SkillShotGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function SkillShotGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = SKILL_SHOT_CONFIG[difficulty];

  const [phase, setPhase] = useState<Phase>("idle");
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [shots, setShots] = useState<Shot[]>([]);
  const [pendingSkills, setPendingSkills] = useState<PendingSkill[]>([]);
  const [impacts, setImpacts] = useState<ImpactFx[]>([]);
  const [arenaSize, setArenaSize] = useState({ width: ARENA_WIDTH, height: ARENA_HEIGHT });

  const rafRef = useRef<number | null>(null);
  const runStartRef = useRef(0);
  const seedRef = useRef(Math.random() * 1_000_000);
  const skillIdRef = useRef(0);
  const shotsRef = useRef<Shot[]>([]);
  const arenaRef = useRef<HTMLDivElement>(null);

  const cancelRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const tick = useCallback(() => {
    const tMs = performance.now() - runStartRef.current;
    const p = computeTargetPos(cfg.path, tMs, cfg.speedPctPerSec, seedRef.current);
    setTargetPos(p);
    rafRef.current = requestAnimationFrame(tick);
  }, [cfg]);

  const startRun = useCallback(() => {
    seedRef.current = Math.random() * 1_000_000;
    runStartRef.current = performance.now();
    shotsRef.current = [];
    setShots([]);
    setPendingSkills([]);
    setImpacts([]);
    setPhase("running");
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // End condition
  useEffect(() => {
    if (phase === "running" && shotsRef.current.length >= cfg.shots && pendingSkills.length === 0) {
      cancelRaf();
      const hits = shotsRef.current.filter((s) => s.landed).length;
      setPhase("done");
      onComplete(hits);
    }
  }, [phase, shots, pendingSkills, cfg.shots, onComplete]);

  useEffect(() => () => cancelRaf(), []);

  // Track arena size for accurate hit detection (in pixel space)
  useEffect(() => {
    if (phase !== "running") return;
    const update = () => {
      if (arenaRef.current) {
        setArenaSize({
          width: arenaRef.current.clientWidth,
          height: arenaRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [phase]);

  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== "running") return;
    // Cap total shots (including pending)
    const totalInitiated = shotsRef.current.length + pendingSkills.length;
    if (totalInitiated >= cfg.shots) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const now = performance.now();
    const id = ++skillIdRef.current;
    const skill: PendingSkill = {
      id,
      x: clickX,
      y: clickY,
      bornAt: now,
      landsAt: now + cfg.travelMs,
    };
    setPendingSkills((prev) => [...prev, skill]);

    // Resolve after travelMs — target keeps moving naturally in between
    setTimeout(() => {
      const t = performance.now() - runStartRef.current;
      const resolved = computeTargetPos(
        cfg.path,
        t,
        cfg.speedPctPerSec,
        seedRef.current
      );

      const dxPx = ((clickX - resolved.x) / 100) * arenaSize.width;
      const dyPx = ((clickY - resolved.y) / 100) * arenaSize.height;
      const distPx = Math.hypot(dxPx, dyPx);
      const hit = distPx <= cfg.tolerancePx;

      const newShot = { landed: hit, distance: distPx };
      shotsRef.current = [...shotsRef.current, newShot];
      setShots([...shotsRef.current]);
      setPendingSkills((prev) => prev.filter((s) => s.id !== id));

      const impactId = id;
      setImpacts((prev) => [
        ...prev,
        { id: impactId, x: clickX, y: clickY, hit, targetX: resolved.x, targetY: resolved.y },
      ]);
      // Fade impact after 900ms
      setTimeout(() => {
        setImpacts((prev) => prev.filter((i) => i.id !== impactId));
      }, 900);
    }, cfg.travelMs);
  };

  const hits = shots.filter((s) => s.landed).length;

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (phase === "done") {
    const avgDist =
      shots.length > 0
        ? Math.round(shots.reduce((a, b) => a + b.distance, 0) / shots.length)
        : 0;
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="card p-8 text-center space-y-5">
          <div className="text-5xl">✨</div>
          <p className="text-7xl font-black text-violet-400 tabular-nums">{hits}</p>
          <p className="text-sm text-gray-500">
            / {cfg.shots} {t.skillShotHits}
          </p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold">
                {Math.round((hits / cfg.shots) * 100)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">{t.aimAccuracy}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold">{avgDist}px</p>
              <p className="text-xs text-gray-400 mt-1">avg miss</p>
            </div>
          </div>
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

  // ── Idle / Tutorial ──────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">✨</div>
          <h2 className="text-xl font-bold text-white">How it works</h2>
        </div>

        {/* Tutorial steps */}
        <div className="space-y-4 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
              1
            </div>
            <p className="text-sm text-gray-300">
              A <strong className="text-rose-400">red target</strong> moves on
              screen. It <strong className="text-white">keeps moving</strong>{" "}
              — don't click where it is, click where it{" "}
              <strong className="text-white">will be</strong>.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
              2
            </div>
            <p className="text-sm text-gray-300">
              Your click becomes a <strong className="text-violet-400">skill</strong>{" "}
              that takes{" "}
              <strong className="text-white">{cfg.travelMs}ms</strong> to land.
              You'll see a purple ring countdown at your click point.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
              3
            </div>
            <p className="text-sm text-gray-300">
              If the target is within{" "}
              <strong className="text-white">{cfg.tolerancePx}px</strong> of
              your click point when the skill lands → <strong className="text-green-400">HIT</strong>. Otherwise miss.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
              4
            </div>
            <p className="text-sm text-gray-300">
              {cfg.shots} shots total. Path: <strong className="text-white">{cfg.path}</strong>.
              You can fire multiple skills in flight.
            </p>
          </div>
        </div>

        {/* Tip */}
        <div className="max-w-md mx-auto bg-violet-950/40 border border-violet-700/40 rounded-lg p-3 text-xs text-violet-200 leading-relaxed">
          💡 Tip: the faster the target moves and the longer the travel time,
          the further <em>ahead</em> you need to click. Watch where the target
          is going and aim your click there.
        </div>

        <div className="text-center">
          <button className="btn-primary px-10 py-3" onClick={startRun}>
            {t.start}
          </button>
        </div>
      </div>
    );
  }

  // ── Running ──────────────────────────────────────────────────────────────────
  const totalInitiated = shotsRef.current.length + pendingSkills.length;
  const progress = totalInitiated / cfg.shots;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
        <span>
          {t.skillShotShot} {Math.min(totalInitiated + 1, cfg.shots)}{" "}
          {t.skillShotShotOf} {cfg.shots}
        </span>
        <span>
          <span className="text-green-400">{hits}</span> hits ·{" "}
          <span className="text-rose-400">{shots.length - hits}</span> miss
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Arena */}
      <div
        ref={arenaRef}
        className="relative mx-auto rounded-2xl border-2 border-indigo-900/50 bg-gradient-to-br from-slate-900 to-indigo-950 overflow-hidden cursor-crosshair select-none"
        style={{
          width: "100%",
          maxWidth: ARENA_WIDTH,
          aspectRatio: `${ARENA_WIDTH} / ${ARENA_HEIGHT}`,
        }}
        onClick={handleArenaClick}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Target */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-red-400 to-rose-600 shadow-lg shadow-rose-500/40 border-2 border-white/30 pointer-events-none"
          style={{
            width: TARGET_DIAMETER,
            height: TARGET_DIAMETER,
            left: `calc(${targetPos.x}% - ${TARGET_DIAMETER / 2}px)`,
            top: `calc(${targetPos.y}% - ${TARGET_DIAMETER / 2}px)`,
          }}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xl">
            💢
          </span>
        </div>

        {/* Pending skills — countdown rings */}
        {pendingSkills.map((s) => (
          <PendingSkillRing
            key={s.id}
            skill={s}
            now={performance.now()}
            tolerancePx={cfg.tolerancePx}
          />
        ))}

        {/* Impact effects */}
        {impacts.map((imp) => (
          <div key={imp.id} className="absolute inset-0 pointer-events-none">
            {/* Click point burst */}
            <div
              className={cn(
                "absolute rounded-full animate-fade-in",
                imp.hit
                  ? "bg-green-400/30 border-4 border-green-300"
                  : "bg-rose-400/30 border-4 border-rose-300"
              )}
              style={{
                width: cfg.tolerancePx * 2,
                height: cfg.tolerancePx * 2,
                left: `calc(${imp.x}% - ${cfg.tolerancePx}px)`,
                top: `calc(${imp.y}% - ${cfg.tolerancePx}px)`,
              }}
            />
            {/* Where target actually was at impact (only on miss) */}
            {!imp.hit && (
              <div
                className="absolute rounded-full border-2 border-yellow-400 bg-yellow-300/20 animate-fade-in"
                style={{
                  width: TARGET_DIAMETER,
                  height: TARGET_DIAMETER,
                  left: `calc(${imp.targetX}% - ${TARGET_DIAMETER / 2}px)`,
                  top: `calc(${imp.targetY}% - ${TARGET_DIAMETER / 2}px)`,
                }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-yellow-400 bg-yellow-900/80 px-1 rounded whitespace-nowrap">
                  target @ impact
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-600">
        Click <strong className="text-white">ahead</strong> of the target — skill takes{" "}
        <strong className="text-white">{cfg.travelMs}ms</strong> to arrive
      </p>
    </div>
  );
}

// ─── Pending skill ring: shrinks over travelMs to visualize countdown ────────

function PendingSkillRing({
  skill,
  now,
  tolerancePx,
}: {
  skill: PendingSkill;
  now: number;
  tolerancePx: number;
}) {
  // Re-render on animation frame to update the ring
  const [, forceTick] = useState(0);
  useEffect(() => {
    let raf: number;
    const loop = () => {
      forceTick((v) => v + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const total = skill.landsAt - skill.bornAt;
  const elapsed = Math.min(total, performance.now() - skill.bornAt);
  const progress = elapsed / total; // 0..1 (1 = landing now)

  // Ring shrinks from 3× tolerance → 1× tolerance as the skill "travels"
  const outerRadius = tolerancePx * 3 * (1 - progress) + tolerancePx * progress;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: outerRadius * 2,
        height: outerRadius * 2,
        left: `calc(${skill.x}% - ${outerRadius}px)`,
        top: `calc(${skill.y}% - ${outerRadius}px)`,
      }}
    >
      <div className="w-full h-full rounded-full border-2 border-violet-400/80 bg-violet-500/10" />
      {/* Inner tolerance ring (fixed size, shows exact hit radius) */}
      <div
        className="absolute rounded-full border-2 border-violet-300 border-dashed"
        style={{
          width: tolerancePx * 2,
          height: tolerancePx * 2,
          left: `calc(50% - ${tolerancePx}px)`,
          top: `calc(50% - ${tolerancePx}px)`,
        }}
      />
      {/* Crosshair dot */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-200" />
    </div>
  );
}
