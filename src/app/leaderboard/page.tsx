"use client";

import { useState, useEffect } from "react";
import { GAMES, formatScore, type GameId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import {
  DIFFICULTIES,
  DIFFICULTY_COLORS,
  DEFAULT_DIFFICULTY,
  type Difficulty,
} from "@/lib/difficulty";
import {
  GAME_ICONS,
  DIFFICULTY_LUCIDE_ICONS,
  rankMedal,
} from "@/lib/icons";
import { UserAvatar } from "@/components/UserAvatar";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  value: number;
  createdAt: string;
  /** 合成（fixture）用户 vs 真实数据库用户 */
  synthetic?: boolean;
}

export default function LeaderboardPage() {
  const { t } = useLang();
  const [activeGame, setActiveGame] = useState<GameId>("reaction-time");
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>(
    DEFAULT_DIFFICULTY
  );
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(
      `/api/scores?game=${activeGame}&difficulty=${activeDifficulty}&limit=20`
    )
      .then((r) => r.json())
      .then((d) => setData(d.leaderboard ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeGame, activeDifficulty]);

  const game = GAMES.find((g) => g.id === activeGame)!;
  const HeaderIcon = GAME_ICONS[activeGame];
  const ActiveDiffIcon = DIFFICULTY_LUCIDE_ICONS[activeDifficulty];

  const diffLabel: Record<Difficulty, string> = {
    easy: t.difficultyEasy,
    medium: t.difficultyMedium,
    hard: t.difficultyHard,
    hell: t.difficultyHell,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">{t.lbTitle}</h1>
        <p className="text-gray-400">{t.lbDesc}</p>
      </div>

      {/* Game tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {GAMES.filter((g) => !("hidden" in g && g.hidden)).map((g) => {
          const Icon = GAME_ICONS[g.id];
          return (
            <button
              key={g.id}
              onClick={() => setActiveGame(g.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                activeGame === g.id
                  ? "bg-brand-600 text-white"
                  : "bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white"
              )}
            >
              <Icon size={16} strokeWidth={2.4} />
              <span>{t[g.titleKey]}</span>
            </button>
          );
        })}
      </div>

      {/* Difficulty tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {DIFFICULTIES.map((d) => {
          const DIcon = DIFFICULTY_LUCIDE_ICONS[d];
          return (
            <button
              key={d}
              onClick={() => setActiveDifficulty(d)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border",
                activeDifficulty === d
                  ? `bg-gradient-to-br ${DIFFICULTY_COLORS[d]} text-white border-white/20 shadow`
                  : "bg-white/[0.04] text-gray-400 border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
              )}
            >
              <DIcon size={13} strokeWidth={2.6} />
              <span>{diffLabel[d]}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${game.color} flex items-center justify-center text-white shadow`}
          >
            <HeaderIcon size={18} strokeWidth={2.4} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold">{t[game.titleKey]}</h2>
            <p className="text-xs text-gray-400">
              {game.lowerIsBetter ? t.lbLower : t.lbHigher} · {t.lbBest}
            </p>
          </div>
          <div
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full text-white bg-gradient-to-br inline-flex items-center gap-1",
              DIFFICULTY_COLORS[activeDifficulty]
            )}
          >
            <ActiveDiffIcon size={12} strokeWidth={2.6} />
            {diffLabel[activeDifficulty]}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-500">{t.loading}</div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-gray-500">{t.lbEmpty}</div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {data.map((entry) => {
              const medal = rankMedal(entry.rank);
              return (
                <div
                  key={entry.userId}
                  className={cn(
                    "flex items-center px-6 py-3.5 transition-colors",
                    entry.rank <= 3
                      ? "bg-gradient-to-r from-yellow-500/[0.04] to-transparent"
                      : "hover:bg-white/[0.03]"
                  )}
                >
                  {medal ? (
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 shadow bg-gradient-to-br",
                        medal.gradient
                      )}
                    >
                      <medal.Icon
                        size={18}
                        strokeWidth={2.4}
                        className={medal.text}
                      />
                    </div>
                  ) : (
                    <div className="w-10 text-center font-bold text-sm mr-3 tabular-nums text-gray-500">
                      #{entry.rank}
                    </div>
                  )}
                  <UserAvatar
                    userId={entry.userId}
                    name={entry.userName}
                    size={36}
                    className="mr-3 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{entry.userName}</div>
                  </div>
                  <div className="font-mono font-bold text-brand-300 tabular-nums ml-2">
                    {formatScore(activeGame, entry.value, t)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
