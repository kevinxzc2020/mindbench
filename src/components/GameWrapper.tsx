"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { GAMES, formatScore, type GameId } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface GameWrapperProps {
  gameId: GameId;
  children: (onComplete: (score: number) => void) => React.ReactNode;
}

export function GameWrapper({ gameId, children }: GameWrapperProps) {
  const { data: session } = useSession();
  const game = GAMES.find((g) => g.id === gameId)!;

  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = async (score: number) => {
    setLatestScore(score);
    setSaved(false);
    setError("");

    if (!session) return;

    setSaving(true);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: gameId, value: score }),
      });
      if (res.ok) setSaved(true);
      else setError("保存失败，请重试");
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Title */}
      <div className="mb-8 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl shadow`}>
          {game.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{game.titleZh}</h1>
          <p className="text-gray-400 text-sm">{game.description}</p>
        </div>
      </div>

      {/* Game area */}
      {children(handleComplete)}

      {/* Score feedback */}
      {latestScore !== null && (
        <div className="mt-8 card p-6 text-center animate-fade-in">
          <p className="text-gray-400 text-sm mb-2">本次成绩</p>
          <p className="text-4xl font-extrabold text-brand-400">
            {formatScore(gameId, latestScore)}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            {saving && <span className="text-gray-400">保存中…</span>}
            {saved && (
              <span className="text-green-400 flex items-center gap-1">
                ✓ 成绩已保存
              </span>
            )}
            {error && <span className="text-red-400">{error}</span>}
            {!session && !saving && (
              <span className="text-gray-400">
                <Link href="/login" className="text-brand-400 hover:underline">登录</Link>{" "}
                以保存成绩到排行榜
              </span>
            )}
          </div>
          <div className="mt-4">
            <Link href="/leaderboard" className="text-brand-400 text-sm hover:underline">
              查看排行榜 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
