"use client";

import { useState, useEffect } from "react";
import { GAMES, formatScore, type GameId } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  value: number;
  createdAt: string;
}

export default function LeaderboardPage() {
  const [activeGame, setActiveGame] = useState<GameId>("reaction-time");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/scores?game=${activeGame}&limit=20`)
      .then((r) => r.json())
      .then((d) => setData(d.leaderboard ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeGame]);

  const game = GAMES.find((g) => g.id === activeGame)!;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">排行榜</h1>
        <p className="text-gray-400">全球最佳成绩，实时更新</p>
      </div>

      {/* Game tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGame(g.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              activeGame === g.id
                ? "bg-brand-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            )}
          >
            <span>{g.icon}</span>
            <span>{g.titleZh}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${game.color} flex items-center justify-center text-lg`}>
            {game.icon}
          </div>
          <div>
            <h2 className="font-bold">{game.titleZh}</h2>
            <p className="text-xs text-gray-400">
              {game.lowerIsBetter ? "越低越好" : "越高越好"} · 显示每位玩家最佳成绩
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-500">加载中…</div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            暂无数据，快来成为第一个登榜的人！
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {data.map((entry) => (
              <div key={entry.userId} className="flex items-center px-6 py-4 hover:bg-gray-800/50 transition-colors">
                <div className={cn("w-8 text-center font-bold text-sm mr-4",
                  entry.rank === 1 ? "text-yellow-400" :
                  entry.rank === 2 ? "text-gray-300" :
                  entry.rank === 3 ? "text-amber-600" :
                  "text-gray-500"
                )}>
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                </div>
                <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  {entry.userName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 font-medium">{entry.userName}</div>
                <div className="font-mono font-bold text-brand-300">
                  {formatScore(activeGame, entry.value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
