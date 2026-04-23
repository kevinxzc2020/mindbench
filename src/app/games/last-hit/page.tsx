"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import { LAST_HIT_CONFIG, type Difficulty } from "@/lib/difficulty";
import { cn } from "@/lib/utils";

type Phase = "idle" | "wave" | "done";
type Killer = "player" | "ally" | "tower";

interface Shot {
  id: number;
  source: Killer;
  damage: number;
  firedAt: number;
  arrivesAt: number;
  fromSlot: number; // 0..2 for allies, 3 for tower, 4 for player (visual Y)
}

export default function LastHitPage() {
  return (
    <GameWrapper gameId="last-hit">
      {(onComplete, difficulty) => (
        <LastHitGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function LastHitGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = LAST_HIT_CONFIG[difficulty];

  const [phase, setPhase] = useState<Phase>("idle");
  const [roundIdx, setRoundIdx] = useState(0);
  const [hp, setHp] = useState(cfg.minionHp);
  const [incoming, setIncoming] = useState<Shot[]>([]);
  const [feedback, setFeedback] = useState<Killer | null>(null);
  const [outcomes, setOutcomes] = useState<Killer[]>([]);
  // Force re-render so projectiles animate smoothly
  const [, setFrameTick] = useState(0);

  const hpRef = useRef(cfg.minionHp);
  const shotIdRef = useRef(0);
  const incomingRef = useRef<Shot[]>([]);
  const outcomesRef = useRef<Killer[]>([]);
  const tickRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);

  const cancelTick = () => {
    if (tickRef.current != null) {
      cancelAnimationFrame(tickRef.current);
      tickRef.current = null;
    }
  };

  // Schedule all ally (and optional tower) shots for a new wave
  const scheduleRoundShots = useCallback(
    (now: number): Shot[] => {
      const shots: Shot[] = [];
      let t = 0;
      const allyTravelMs = 350;
      for (let i = 0; i < cfg.allyHits; i++) {
        const jitter =
          (Math.random() * 2 - 1) * cfg.allyIntervalJitterMs;
        t += cfg.allyIntervalMs + jitter;
        shots.push({
          id: ++shotIdRef.current,
          source: "ally",
          damage: cfg.allyDamage,
          firedAt: now + t - allyTravelMs,
          arrivesAt: now + t,
          fromSlot: i % 3, // round-robin across 3 ally slots
        });
      }
      if (cfg.towerDamage > 0) {
        const towerTravelMs = 400;
        for (let i = 1; i <= 10; i++) {
          const arrivesAt = now + cfg.towerIntervalMs * i;
          shots.push({
            id: ++shotIdRef.current,
            source: "tower",
            damage: cfg.towerDamage,
            firedAt: arrivesAt - towerTravelMs,
            arrivesAt,
            fromSlot: 3,
          });
        }
      }
      shots.sort((a, b) => a.arrivesAt - b.arrivesAt);
      return shots;
    },
    [cfg]
  );

  // Main tick loop
  const runTick = useCallback(() => {
    const loop = () => {
      const now = performance.now();

      // Apply arrived shots
      let hp = hpRef.current;
      let killer: Killer | null = null;
      const still: Shot[] = [];
      for (const shot of incomingRef.current) {
        if (shot.arrivesAt <= now) {
          if (hp > 0) {
            hp -= shot.damage;
            if (hp <= 0 && killer == null) {
              killer = shot.source;
            }
          }
        } else {
          still.push(shot);
        }
      }
      hpRef.current = Math.max(0, hp);
      setHp(Math.max(0, hp));
      if (still.length !== incomingRef.current.length) {
        incomingRef.current = still;
        setIncoming(still);
      }
      setFrameTick((v) => (v + 1) % 1000);

      if (hp <= 0 && !resolvedRef.current && killer) {
        resolvedRef.current = true;
        outcomesRef.current = [...outcomesRef.current, killer];
        setOutcomes([...outcomesRef.current]);
        setFeedback(killer);
        cancelTick();
        // Schedule next round after feedback pause
        setTimeout(() => {
          advanceRound();
        }, 900);
        return;
      }

      tickRef.current = requestAnimationFrame(loop);
    };
    tickRef.current = requestAnimationFrame(loop);
  }, []);

  const advanceRound = useCallback(() => {
    setRoundIdx((idx) => {
      const next = idx + 1;
      if (next >= cfg.rounds) {
        const kills = outcomesRef.current.filter(
          (o) => o === "player"
        ).length;
        setPhase("done");
        onComplete(kills);
        return next;
      } else {
        // Spawn next minion
        const now = performance.now();
        hpRef.current = cfg.minionHp;
        setHp(cfg.minionHp);
        resolvedRef.current = false;
        setFeedback(null);
        const shots = scheduleRoundShots(now);
        incomingRef.current = shots;
        setIncoming(shots);
        runTick();
        return next;
      }
    });
  }, [cfg.rounds, cfg.minionHp, onComplete, scheduleRoundShots, runTick]);

  const startGame = useCallback(() => {
    outcomesRef.current = [];
    setOutcomes([]);
    setRoundIdx(0);
    const now = performance.now();
    hpRef.current = cfg.minionHp;
    setHp(cfg.minionHp);
    resolvedRef.current = false;
    setFeedback(null);
    const shots = scheduleRoundShots(now);
    incomingRef.current = shots;
    setIncoming(shots);
    setPhase("wave");
    runTick();
  }, [cfg.minionHp, scheduleRoundShots, runTick]);

  useEffect(() => () => cancelTick(), []);

  const playerAttack = useCallback(() => {
    if (phase === "idle") {
      startGame();
      return;
    }
    if (phase !== "wave" || resolvedRef.current) return;
    // Only one player shot in flight at a time
    if (incomingRef.current.some((s) => s.source === "player")) return;

    const now = performance.now();
    const shot: Shot = {
      id: ++shotIdRef.current,
      source: "player",
      damage: cfg.playerAtk,
      firedAt: now,
      arrivesAt: now + cfg.playerTravelMs,
      fromSlot: 4,
    };
    incomingRef.current = [...incomingRef.current, shot];
    setIncoming(incomingRef.current);
  }, [phase, cfg.playerAtk, cfg.playerTravelMs, startGame]);

  // Keyboard: Space to attack
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && phase !== "done") {
        e.preventDefault();
        playerAttack();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, playerAttack]);

  const kills = outcomesRef.current.filter((o) => o === "player").length;
  const stolenByAlly = outcomesRef.current.filter((o) => o === "ally").length;
  const stolenByTower = outcomesRef.current.filter((o) => o === "tower").length;

  // ── Done ────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="card p-8 text-center space-y-5">
          <div className="text-5xl">🗡️</div>
          <p className="text-7xl font-black text-yellow-400 tabular-nums">
            {kills}
          </p>
          <p className="text-sm text-gray-500">
            CS / {cfg.rounds} minions
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-400">{kills}</p>
              <p className="text-xs text-gray-400 mt-1">killed</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-orange-400">
                {stolenByAlly}
              </p>
              <p className="text-xs text-gray-400 mt-1">ally stole</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-rose-400">
                {stolenByTower}
              </p>
              <p className="text-xs text-gray-400 mt-1">tower stole</p>
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

  // ── Idle / Tutorial ─────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">🗡️</div>
          <h2 className="text-xl font-bold text-white">Last-Hit — LoL style</h2>
        </div>

        <div className="space-y-3 max-w-lg mx-auto text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 font-bold">1.</span>
            <p>
              Enemy minion has{" "}
              <strong className="text-white">{cfg.minionHp} HP</strong>.
              Your allied archers will fire at it every ~
              {(cfg.allyIntervalMs / 1000).toFixed(1)}s, each dealing{" "}
              <strong className="text-cyan-400">{cfg.allyDamage}</strong>. If
              you do nothing, they will kill it.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 font-bold">2.</span>
            <p>
              Your auto-attack does{" "}
              <strong className="text-yellow-400">
                {cfg.playerAtk} damage
              </strong>{" "}
              after a{" "}
              <strong className="text-white">{cfg.playerTravelMs}ms</strong>{" "}
              travel time. To last-hit, fire when HP ≤{" "}
              <strong className="text-yellow-400">{cfg.playerAtk}</strong> —{" "}
              <em>accounting for</em> ally shots that'll land during your
              travel time.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 font-bold">3.</span>
            <p>
              Fire too early → your hit doesn't finish it, ally steals the
              kill. Fire too late → ally already killed it. Only the{" "}
              <strong className="text-green-400">killing blow</strong> gets
              gold (CS).
            </p>
          </div>
          {cfg.towerDamage > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-rose-400 font-bold">⚠</span>
              <p>
                <strong className="text-rose-400">Under tower:</strong> the
                tower hits every{" "}
                <strong className="text-white">
                  {(cfg.towerIntervalMs / 1000).toFixed(1)}s
                </strong>{" "}
                for{" "}
                <strong className="text-rose-400">
                  {cfg.towerDamage} damage
                </strong>
                . Tower steals too.
              </p>
            </div>
          )}
        </div>

        <div className="text-center space-y-3">
          <button className="btn-primary px-10 py-3" onClick={startGame}>
            {t.start}
          </button>
          <p className="text-xs text-gray-600">
            Click the minion or press{" "}
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">
              Space
            </kbd>{" "}
            to attack
          </p>
        </div>
      </div>
    );
  }

  // ── Wave ────────────────────────────────────────────────────────────────────
  const hpPct = (hp / cfg.minionHp) * 100;
  const atkPct = (cfg.playerAtk / cfg.minionHp) * 100;
  const inKillWindow = hp > 0 && hp <= cfg.playerAtk;
  const playerShotInFlight = incoming.some((s) => s.source === "player");

  // Slot Y positions (percent of arena height)
  const slotY: Record<number, number> = {
    0: 18, // ally 1
    1: 40, // ally 2
    2: 62, // ally 3
    3: 82, // tower (or alt ally)
    4: 82, // player
  };
  const now = performance.now();

  return (
    <div className="space-y-4">
      {/* Top stats */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-gray-400">
          Wave {Math.min(roundIdx + 1, cfg.rounds)} / {cfg.rounds}
        </span>
        <span className="flex items-center gap-3">
          <span className="text-green-400">{kills} CS</span>
          <span className="text-orange-400">{stolenByAlly} stolen</span>
          {cfg.towerDamage > 0 && (
            <span className="text-rose-400">{stolenByTower} tower</span>
          )}
        </span>
      </div>

      {/* ATK stat card */}
      <div className="flex items-center justify-between bg-gray-800/60 rounded-lg px-4 py-2 text-sm">
        <span className="text-gray-400">Your ATK</span>
        <span className="font-mono text-2xl font-black text-yellow-400">
          {cfg.playerAtk}
        </span>
      </div>

      {/* Arena */}
      <div
        className={cn(
          "relative w-full rounded-2xl border-2 overflow-hidden cursor-crosshair select-none transition-colors",
          "bg-gradient-to-br from-emerald-950 to-slate-900",
          feedback === "player" && "border-green-500 bg-green-950/40",
          feedback === "ally" && "border-orange-500 bg-orange-950/40",
          feedback === "tower" && "border-rose-500 bg-rose-950/40",
          !feedback && "border-indigo-900/60"
        )}
        style={{ height: 300 }}
        onClick={playerAttack}
      >
        {/* Lane background stripes */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px)",
            backgroundSize: "100% 22%",
          }}
        />

        {/* Left side: allies (slot 0-2), tower (3), player (4) */}
        {/* Ally archers */}
        {[0, 1, 2].map((i) => (
          <div
            key={`ally-${i}`}
            className="absolute left-4 -translate-y-1/2 flex items-center gap-2"
            style={{ top: `${slotY[i]}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-sm shadow">
              🏹
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">
              {cfg.allyDamage}
            </span>
          </div>
        ))}

        {/* Tower (if present) */}
        {cfg.towerDamage > 0 && (
          <div
            className="absolute left-4 -translate-y-1/2 flex items-center gap-2"
            style={{ top: `${slotY[3]}%` }}
          >
            <div className="w-9 h-9 rounded-md bg-rose-700 border border-rose-500 flex items-center justify-center text-sm shadow">
              🏰
            </div>
            <span className="text-[10px] text-rose-400 font-mono">
              {cfg.towerDamage}
            </span>
          </div>
        )}

        {/* Player */}
        <div
          className="absolute left-4 -translate-y-1/2 flex items-center gap-2"
          style={{
            top: cfg.towerDamage > 0 ? "96%" : `${slotY[4]}%`,
            transform: "translateY(-50%)",
          }}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-full bg-yellow-500 border-2 border-yellow-300 flex items-center justify-center text-base shadow transition-transform",
              playerShotInFlight && "scale-110 ring-2 ring-yellow-200"
            )}
          >
            🛡️
          </div>
          <span className="text-[10px] text-yellow-400 font-mono font-bold">
            YOU · {cfg.playerAtk}
          </span>
        </div>

        {/* Minion (right side) */}
        <div
          className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
          style={{ minWidth: 160 }}
        >
          <div className="text-5xl">
            {hp > 0.7 * cfg.minionHp
              ? "😠"
              : hp > 0.3 * cfg.minionHp
              ? "😵"
              : hp > 0.05 * cfg.minionHp
              ? "🫠"
              : "💀"}
          </div>
          {/* HP bar with ATK threshold marker */}
          <div className="w-full space-y-0.5">
            <div className="relative h-5 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
              {/* Kill zone (0 → playerAtk) — soft green background */}
              <div
                className="absolute inset-y-0 left-0 bg-green-500/20"
                style={{ width: `${atkPct}%` }}
              />
              {/* HP fill */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-[width] duration-100",
                  inKillWindow
                    ? "bg-green-400"
                    : hp > 0.5 * cfg.minionHp
                    ? "bg-emerald-600"
                    : "bg-yellow-500"
                )}
                style={{ width: `${hpPct}%` }}
              />
              {/* ATK threshold vertical line */}
              <div
                className="absolute inset-y-0 w-0.5 bg-yellow-300 shadow-[0_0_6px_rgba(250,204,21,0.8)] z-10"
                style={{ left: `${atkPct}%` }}
                title={`You can kill when HP ≤ ${cfg.playerAtk}`}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-yellow-300">
                ↑ ATK {cfg.playerAtk}
              </span>
              <span
                className={cn(
                  "font-bold tabular-nums",
                  inKillWindow ? "text-green-400" : "text-white"
                )}
              >
                {Math.round(hp)} / {cfg.minionHp}
              </span>
            </div>
          </div>
          {inKillWindow && !feedback && (
            <p className="text-green-400 font-black text-sm animate-pulse">
              ⚔ KILL NOW!
            </p>
          )}
        </div>

        {/* Projectiles in flight */}
        {incoming.map((shot) => {
          const total = shot.arrivesAt - shot.firedAt;
          if (total <= 0) return null;
          const elapsed = Math.min(total, Math.max(0, now - shot.firedAt));
          const frac = elapsed / total;
          // Left start X: ~6% (where allies/player sit); right end X: ~78% (minion)
          const startX = 6;
          const endX = 78;
          const x = startX + (endX - startX) * frac;
          const y = slotY[shot.fromSlot] ?? 50;
          // Interpolate vertical from source Y to minion Y (50%)
          const yInterp = y + (50 - y) * frac;

          const color =
            shot.source === "player"
              ? "bg-yellow-300 shadow-yellow-400/80"
              : shot.source === "tower"
              ? "bg-rose-400 shadow-rose-500/80"
              : "bg-cyan-300 shadow-cyan-400/80";
          const size = shot.source === "tower" ? 10 : shot.source === "player" ? 8 : 6;

          return (
            <div
              key={shot.id}
              className={cn(
                "absolute rounded-full shadow-lg pointer-events-none",
                color
              )}
              style={{
                width: size,
                height: size,
                left: `calc(${x}% - ${size / 2}px)`,
                top: `calc(${yInterp}% - ${size / 2}px)`,
              }}
            />
          );
        })}

        {/* Feedback banner */}
        {feedback && (
          <div className="absolute inset-x-0 top-4 flex justify-center pointer-events-none">
            <div
              className={cn(
                "px-4 py-1.5 rounded-full font-bold text-sm shadow-xl animate-fade-in",
                feedback === "player" && "bg-green-600 text-white",
                feedback === "ally" && "bg-orange-600 text-white",
                feedback === "tower" && "bg-rose-600 text-white"
              )}
            >
              {feedback === "player" && "✓ Perfect last-hit! +gold"}
              {feedback === "ally" && "✗ Ally stole it"}
              {feedback === "tower" && "✗ Tower took it"}
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-600">
        Click the arena or press{" "}
        <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">
          Space
        </kbd>{" "}
        — your arrow takes{" "}
        <strong className="text-yellow-400">{cfg.playerTravelMs}ms</strong> to
        arrive
      </p>
    </div>
  );
}
