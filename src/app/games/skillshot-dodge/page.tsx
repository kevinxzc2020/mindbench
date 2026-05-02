"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import type { Difficulty } from "@/lib/difficulty";
import { Flame } from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const DODGE_CONFIG: Record<
  Difficulty,
  { fbSpeed: number; maxFb: number; spawnMs: number; playerSpeed: number }
> = {
  easy:   { fbSpeed: 2.5, maxFb: 4,  spawnMs: 250, playerSpeed: 3.5 },
  medium: { fbSpeed: 3.5, maxFb: 6,  spawnMs: 175, playerSpeed: 3.5 },
  hard:   { fbSpeed: 5,   maxFb: 8,  spawnMs: 130, playerSpeed: 4   },
  hell:   { fbSpeed: 7,   maxFb: 10, spawnMs: 100, playerSpeed: 4   },
};

const CANVAS_SIZE  = 600;
const PLAYER_R     = 18; // collision + draw radius
const FB_R         = 14;
const HIT_DIST     = PLAYER_R + FB_R - 4; // generous ~28 px

interface Fireball { x: number; y: number; vx: number; vy: number }

type Phase = "idle" | "playing" | "dead";

// ── Page wrapper ──────────────────────────────────────────────────────────────
export default function SkillshotDodgePage() {
  return (
    <GameWrapper gameId="skillshot-dodge">
      {(onComplete, difficulty) => (
        <SkillshotDodgeGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

// ── Game component ────────────────────────────────────────────────────────────
function SkillshotDodgeGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = DODGE_CONFIG[difficulty];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase]   = useState<Phase>("idle");
  const [score, setScore]   = useState(0);

  // All mutable game state lives in a ref so the RAF closure never goes stale
  const gs = useRef({
    player:    { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 },
    fireballs: [] as Fireball[],
    keys:      new Set<string>(),
    startTime: 0,
    lastSpawn: 0,
    rafId:     0,
    alive:     false,
    scoreSec:  0,
  });

  // Image assets
  const poroImg = useRef<HTMLImageElement | null>(null);
  const fbImg   = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const load = (src: string) => {
      const img = new Image();
      img.src = src;
      return img;
    };
    poroImg.current = load("/skillshot-dodger/poro_icon.png");
    fbImg.current   = load("/skillshot-dodger/fireball4.png");
  }, []);

  // ── Spawn helper ─────────────────────────────────────────────────────────
  const spawnFireball = useCallback(() => {
    const state = gs.current;
    if (state.fireballs.length >= cfg.maxFb) return;

    let x: number, y: number;
    switch (Math.floor(Math.random() * 4)) {
      case 0: x = Math.random() * CANVAS_SIZE; y = -10;              break; // top
      case 1: x = CANVAS_SIZE + 10;            y = Math.random() * CANVAS_SIZE; break; // right
      case 2: x = Math.random() * CANVAS_SIZE; y = CANVAS_SIZE + 10; break; // bottom
      default:x = -10;                         y = Math.random() * CANVAS_SIZE; break; // left
    }
    // Aim at a random point near center so fireballs traverse the arena
    const tx  = CANVAS_SIZE * (0.25 + Math.random() * 0.5);
    const ty  = CANVAS_SIZE * (0.25 + Math.random() * 0.5);
    const len = Math.hypot(tx - x, ty - y) || 1;
    state.fireballs.push({
      x, y,
      vx: ((tx - x) / len) * cfg.fbSpeed,
      vy: ((ty - y) / len) * cfg.fbSpeed,
    });
  }, [cfg]);

  // ── Start ─────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const state  = gs.current;
    state.player    = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
    state.fireballs = [];
    state.keys      = new Set();
    state.startTime = performance.now();
    state.lastSpawn = performance.now();
    state.alive     = true;
    state.scoreSec  = 0;
    cancelAnimationFrame(state.rafId);
    setScore(0);
    setPhase("playing");
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    const state = gs.current;
    const dn = (e: KeyboardEvent) => {
      state.keys.add(e.code);
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))
        e.preventDefault();
    };
    const up = (e: KeyboardEvent) => state.keys.delete(e.code);
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup",   up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup",   up);
    };
  }, [phase]);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext("2d")!;
    const state = gs.current;

    const draw = () => {
      const { player, fireballs, scoreSec } = state;

      // Background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Subtle grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= CANVAS_SIZE; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
      }

      // Danger zone glow when many fireballs
      if (fireballs.length >= cfg.maxFb) {
        ctx.save();
        const grad = ctx.createRadialGradient(
          CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.3,
          CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.7,
        );
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, "rgba(239,68,68,0.12)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.restore();
      }

      // Fireballs
      for (const fb of fireballs) {
        const img = fbImg.current;
        if (img?.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, fb.x - FB_R, fb.y - FB_R, FB_R * 2, FB_R * 2);
        } else {
          ctx.beginPath();
          ctx.arc(fb.x, fb.y, FB_R, 0, Math.PI * 2);
          const g = ctx.createRadialGradient(fb.x - 4, fb.y - 4, 2, fb.x, fb.y, FB_R);
          g.addColorStop(0, "#fbbf24");
          g.addColorStop(1, "#ef4444");
          ctx.fillStyle = g;
          ctx.fill();
        }
      }

      // Player
      const img = poroImg.current;
      if (img?.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, player.x - PLAYER_R, player.y - PLAYER_R, PLAYER_R * 2, PLAYER_R * 2);
      } else {
        ctx.beginPath();
        ctx.arc(player.x, player.y, PLAYER_R, 0, Math.PI * 2);
        ctx.fillStyle = "#22c55e";
        ctx.fill();
        ctx.strokeStyle = "#86efac";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(6, 6, 130, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px ui-monospace, monospace";
      ctx.fillText(`⏱ ${scoreSec}s`, 14, 26);
    };

    const loop = () => {
      if (!state.alive) return;
      const now = performance.now();

      // Spawn
      if (now - state.lastSpawn > cfg.spawnMs) {
        spawnFireball();
        state.lastSpawn = now;
      }

      // Move player
      const spd = cfg.playerSpeed;
      const k   = state.keys;
      if (k.has("ArrowLeft")  || k.has("KeyA"))
        state.player.x = Math.max(PLAYER_R, state.player.x - spd);
      if (k.has("ArrowRight") || k.has("KeyD"))
        state.player.x = Math.min(CANVAS_SIZE - PLAYER_R, state.player.x + spd);
      if (k.has("ArrowUp")    || k.has("KeyW"))
        state.player.y = Math.max(PLAYER_R, state.player.y - spd);
      if (k.has("ArrowDown")  || k.has("KeyS"))
        state.player.y = Math.min(CANVAS_SIZE - PLAYER_R, state.player.y + spd);

      // Move & cull fireballs
      state.fireballs = state.fireballs.filter(fb => {
        fb.x += fb.vx;
        fb.y += fb.vy;
        return fb.x > -50 && fb.x < CANVAS_SIZE + 50
            && fb.y > -50 && fb.y < CANVAS_SIZE + 50;
      });

      // Collision
      for (const fb of state.fireballs) {
        if (Math.hypot(fb.x - state.player.x, fb.y - state.player.y) < HIT_DIST) {
          state.alive = false;
          const s = Math.floor((now - state.startTime) / 1000);
          state.scoreSec = s;
          draw();
          setScore(s);
          setPhase("dead");
          onComplete(s);
          return;
        }
      }

      // Update score counter
      const s = Math.floor((now - state.startTime) / 1000);
      if (s !== state.scoreSec) {
        state.scoreSec = s;
        setScore(s);
      }

      draw();
      state.rafId = requestAnimationFrame(loop);
    };

    state.rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(state.rafId);
  }, [phase, cfg, spawnFireball, onComplete]);

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="card p-8 space-y-6">
        <div className="text-center space-y-2">
          <Flame size={72} strokeWidth={1.8} className="mx-auto text-orange-400" />
          <h2 className="text-xl font-bold text-white">Skillshot Dodger</h2>
          <p className="text-gray-400 text-sm">Ported from Python/Pygame · CS 3892</p>
        </div>
        <div className="space-y-3 max-w-md mx-auto text-sm text-gray-300">
          {[
            "Fireballs fly in from the edges — dodge every single one.",
            "Move with Arrow Keys or WASD.",
            "One touch = game over. Survive as long as possible.",
            `Up to ${cfg.maxFb} fireballs at speed ${cfg.fbSpeed} — good luck.`,
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-orange-400 font-bold flex-shrink-0">{i + 1}.</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button className="btn-primary px-10 py-3" onClick={startGame}>
            {t.start}
          </button>
        </div>
      </div>
    );
  }

  // ── Dead ──────────────────────────────────────────────────────────────────
  if (phase === "dead") {
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <Flame size={56} strokeWidth={1.8} className="mx-auto text-red-400" />
        <p className="text-red-400 text-2xl font-bold">You got hit!</p>
        <p className="text-7xl font-black text-orange-400 tabular-nums">{score}</p>
        <p className="text-sm text-gray-500">seconds survived</p>
        <button className="btn-primary px-10 py-3" onClick={startGame}>
          {t.restart}
        </button>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
        <span>Skillshot Dodger</span>
        <span className="text-orange-400 font-mono text-lg font-black tabular-nums">
          {score}s
        </span>
      </div>
      <div className="relative rounded-2xl overflow-hidden border-2 border-orange-900/50 shadow-xl shadow-orange-900/20">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-full block"
        />
      </div>
      <p className="text-center text-xs text-gray-600">
        Arrow Keys or WASD to move · Don't get hit
      </p>
    </div>
  );
}
