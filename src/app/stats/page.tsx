"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GAMES, formatScore, type GameId } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import {
  DIFFICULTIES,
  DIFFICULTY_COLORS,
  DIFFICULTY_ICONS,
  type Difficulty,
} from "@/lib/difficulty";
import { cn } from "@/lib/utils";

interface StatsResponse {
  summary: {
    totalAttempts: number;
    gamesPlayed: number;
    firstPlayedAt: string | null;
    daysActive: number;
  };
  byGame: Array<{
    game: GameId;
    totalAttempts: number;
    byDifficulty: Record<
      Difficulty,
      { best: number | null; attempts: number }
    >;
    history: Array<{
      value: number;
      difficulty: Difficulty;
      createdAt: string;
    }>;
  }>;
  recent: Array<{
    game: GameId;
    difficulty: Difficulty;
    value: number;
    createdAt: string;
  }>;
}

export default function StatsPage() {
  const { data: session, status } = useSession();
  const { t, lang } = useLang();
  const router = useRouter();
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/stats/me")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">{t.loading}</div>
      </div>
    );
  }

  if (!session || !data) return null;

  const diffLabel: Record<Difficulty, string> = {
    easy: t.difficultyEasy,
    medium: t.difficultyMedium,
    hard: t.difficultyHard,
    hell: t.difficultyHell,
  };

  const hasAnyData = data.summary.totalAttempts > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold">{t.statsTitle}</h1>
        <p className="text-gray-400 text-sm">{t.statsDesc}</p>
      </div>

      {!hasAnyData ? (
        <div className="card p-10 text-center space-y-3">
          <div className="text-5xl">📊</div>
          <p className="text-gray-400">{t.statsNoDataYet}</p>
          <Link href="/" className="btn-primary inline-block mt-2">
            {t.home}
          </Link>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              emoji="🎮"
              label={t.statsTotalAttempts}
              value={data.summary.totalAttempts.toString()}
            />
            <SummaryCard
              emoji="🎲"
              label={t.statsGamesPlayed}
              value={`${data.summary.gamesPlayed} / ${GAMES.length}`}
            />
            <SummaryCard
              emoji="📅"
              label={t.statsDaysActive}
              value={data.summary.daysActive.toString()}
            />
            <SummaryCard
              emoji="🌱"
              label={t.statsFirstPlayed}
              value={
                data.summary.firstPlayedAt
                  ? new Date(data.summary.firstPlayedAt).toLocaleDateString(
                      lang === "zh"
                        ? "zh-CN"
                        : lang === "es"
                        ? "es-ES"
                        : "en-US",
                      { month: "short", day: "numeric" }
                    )
                  : "—"
              }
            />
          </div>

          {/* Per-game cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GAMES.map((g) => {
              const gStats = data.byGame.find((x) => x.game === g.id)!;
              const played = gStats.totalAttempts > 0;
              return (
                <div key={g.id} className="card p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow",
                        "bg-gradient-to-br",
                        g.color
                      )}
                    >
                      {g.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">
                        {t[g.titleKey]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {gStats.totalAttempts} {t.totalAttempts.replace(/:$/, "")}
                      </p>
                    </div>
                  </div>

                  {played ? (
                    <>
                      {/* Mini progress chart */}
                      <ProgressChart
                        history={gStats.history}
                        lowerIsBetter={g.lowerIsBetter}
                      />

                      {/* Per-difficulty best */}
                      <div className="grid grid-cols-2 gap-2">
                        {DIFFICULTIES.map((d) => {
                          const stat = gStats.byDifficulty[d];
                          const isEmpty = stat.best == null;
                          return (
                            <div
                              key={d}
                              className={cn(
                                "rounded-lg p-2 text-xs flex items-center gap-2",
                                isEmpty
                                  ? "bg-gray-800/40 text-gray-600"
                                  : "bg-gray-800 text-gray-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0",
                                  isEmpty
                                    ? "bg-gray-700"
                                    : `bg-gradient-to-br ${DIFFICULTY_COLORS[d]}`
                                )}
                              >
                                {DIFFICULTY_ICONS[d]}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-500 text-[10px] uppercase tracking-wider leading-none">
                                  {diffLabel[d]}
                                </p>
                                <p className="font-mono font-bold truncate leading-tight">
                                  {isEmpty
                                    ? "—"
                                    : formatScore(g.id, stat.best!, t)}
                                </p>
                                <p className="text-[10px] text-gray-600 leading-none">
                                  {stat.attempts > 0
                                    ? `${stat.attempts}x`
                                    : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <Link
                        href={`/games/${g.id}`}
                        className="block text-xs text-brand-400 hover:underline pt-1"
                      >
                        {t.testAgain} →
                      </Link>
                    </>
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-600">
                      {t.statsNoHistory}
                      <div className="mt-2">
                        <Link
                          href={`/games/${g.id}`}
                          className="text-brand-400 hover:underline text-xs"
                        >
                          {t.testAgain} →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent activity */}
          <div className="card">
            <div className="px-5 py-3 border-b border-gray-800">
              <h2 className="font-bold">{t.statsRecentActivity}</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {data.recent.map((r, i) => {
                const g = GAMES.find((x) => x.id === r.game)!;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm"
                  >
                    <span className="text-lg w-6 text-center">{g.icon}</span>
                    <span className="flex-1 truncate">{t[g.titleKey]}</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-br flex-shrink-0",
                        DIFFICULTY_COLORS[r.difficulty]
                      )}
                    >
                      {diffLabel[r.difficulty]}
                    </span>
                    <span className="font-mono text-brand-300 w-24 text-right">
                      {formatScore(r.game, r.value, t)}
                    </span>
                    <span className="text-xs text-gray-500 w-24 text-right flex-shrink-0">
                      {formatRelative(r.createdAt, lang)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Links */}
      <div className="flex gap-3">
        <Link href="/profile" className="btn-ghost">
          {t.myRecords}
        </Link>
        <Link href="/leaderboard" className="btn-primary">
          {t.lbTitle}
        </Link>
        <Link href="/" className="btn-ghost">
          {t.home}
        </Link>
      </div>
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-4 text-center space-y-1">
      <div className="text-xl">{emoji}</div>
      <p className="text-2xl font-extrabold text-white tabular-nums">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
        {label}
      </p>
    </div>
  );
}

// ─── Mini SVG progress chart ─────────────────────────────────────────────────
//
// Plots all historical scores (oldest → newest, left → right) as a simple line
// with dots. Colors depend on lowerIsBetter:
//   lowerIsBetter = true  → lower values are at the top (so improvement = up)
//   lowerIsBetter = false → higher values are at the top (so improvement = up)
// This way "up" always visually means "better", no matter the game.

function ProgressChart({
  history,
  lowerIsBetter,
}: {
  history: Array<{ value: number; difficulty: Difficulty; createdAt: string }>;
  lowerIsBetter: boolean;
}) {
  if (history.length === 0) return null;

  const width = 300;
  const height = 80;
  const padX = 8;
  const padY = 10;

  const values = history.map((h) => h.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  // Map value → Y coordinate (higher = better position, always at top)
  const yForValue = (v: number) => {
    // Normalize 0..1 where 1 = best
    const betterNorm = lowerIsBetter
      ? 1 - (v - minV) / range
      : (v - minV) / range;
    return height - padY - betterNorm * (height - 2 * padY);
  };

  const xForIndex = (i: number) => {
    if (history.length === 1) return width / 2;
    return padX + (i / (history.length - 1)) * (width - 2 * padX);
  };

  const points = history.map((h, i) => ({
    x: xForIndex(i),
    y: yForValue(h.value),
    difficulty: h.difficulty,
  }));

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  // Difficulty → dot color (CSS-friendly; matching our gradient themes)
  const dotColor: Record<Difficulty, string> = {
    easy: "#10b981",   // emerald
    medium: "#3b82f6", // blue
    hard: "#f97316",   // orange
    hell: "#ef4444",   // red
  };

  return (
    <div className="bg-gray-800/40 rounded-lg p-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-20"
        preserveAspectRatio="none"
      >
        {/* Horizontal gridlines */}
        {[0.25, 0.5, 0.75].map((frac, i) => (
          <line
            key={i}
            x1={padX}
            y1={padY + frac * (height - 2 * padY)}
            x2={width - padX}
            y2={padY + frac * (height - 2 * padY)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        ))}

        {/* Line */}
        {points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="rgba(125, 211, 252, 0.5)"
            strokeWidth={1.5}
          />
        )}

        {/* Dots per difficulty */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2.5}
            fill={dotColor[p.difficulty]}
          />
        ))}
      </svg>
      <p className="text-[10px] text-gray-600 text-center mt-1">
        {history.length} attempts · ↑ = better
      </p>
    </div>
  );
}

// ─── Relative time formatter ─────────────────────────────────────────────────

function formatRelative(iso: string, lang: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffSec = (now.getTime() - then.getTime()) / 1000;

  if (diffSec < 60) return lang === "zh" ? "刚刚" : lang === "es" ? "ahora" : "just now";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return lang === "zh" ? `${m}分钟前` : lang === "es" ? `hace ${m}m` : `${m}m ago`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return lang === "zh" ? `${h}小时前` : lang === "es" ? `hace ${h}h` : `${h}h ago`;
  }
  const d = Math.floor(diffSec / 86400);
  if (d < 30)
    return lang === "zh" ? `${d}天前` : lang === "es" ? `hace ${d}d` : `${d}d ago`;
  // Fall back to date
  const localeMap: Record<string, string> = {
    en: "en-US",
    zh: "zh-CN",
    es: "es-ES",
  };
  return then.toLocaleDateString(localeMap[lang] ?? "en-US", {
    month: "short",
    day: "numeric",
  });
}
