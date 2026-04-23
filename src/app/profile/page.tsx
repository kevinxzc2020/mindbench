"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GAMES, formatScore, type GameId } from "@/lib/utils";

interface ScoreEntry {
  game: string;
  best: number | null;
  attempts: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/scores/me")
      .then((r) => r.json())
      .then((d) => setScores(d.scores ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">加载中…</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* User info */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-2xl font-black text-white">
          {session.user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{session.user?.name}</h1>
          <p className="text-gray-400 text-sm">{session.user?.email}</p>
        </div>
      </div>

      {/* Score cards */}
      <h2 className="text-lg font-bold mb-4 text-gray-200">我的最佳成绩</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {GAMES.map((game) => {
          const scoreData = scores.find((s) => s.game === game.id);
          return (
            <div key={game.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${game.color} flex items-center justify-center text-lg`}>
                  {game.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm">{game.titleZh}</p>
                  <p className="text-xs text-gray-500">共测试 {scoreData?.attempts ?? 0} 次</p>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-brand-300">
                {scoreData?.best != null
                  ? formatScore(game.id as GameId, scoreData.best)
                  : "—"}
              </p>
              <Link href={`/games/${game.id}`} className="text-xs text-brand-400 hover:underline mt-2 inline-block">
                再次测试 →
              </Link>
            </div>
          );
        })}
      </div>

      {/* Links */}
      <div className="flex gap-4">
        <Link href="/leaderboard" className="btn-primary">查看排行榜</Link>
        <Link href="/" className="btn-ghost">返回首页</Link>
      </div>
    </div>
  );
}
