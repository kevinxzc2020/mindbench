import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GAMES, type GameId } from "@/lib/utils";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";

// GET /api/stats/me
// Aggregated per-user statistics: totals, per-game × difficulty best/attempts,
// score history per game (for mini-chart), and recent activity log.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = session.user.id;

  // Pull everything once; dataset per user is small enough
  const all = await prisma.score.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalAttempts = all.length;
  const distinctGames = new Set(all.map((s) => s.game));
  const gamesPlayed = distinctGames.size;
  const firstPlayedAt =
    all.length > 0 ? all[all.length - 1].createdAt : null;
  const dayKeys = new Set(
    all.map((s) => s.createdAt.toISOString().slice(0, 10))
  );
  const daysActive = dayKeys.size;

  // ── Per-game × difficulty breakdown ────────────────────────────────────────
  const byGame = GAMES.map((g) => {
    const gameScores = all.filter((s) => s.game === g.id);
    const byDifficulty: Record<
      Difficulty,
      { best: number | null; attempts: number }
    > = {
      easy:   { best: null, attempts: 0 },
      medium: { best: null, attempts: 0 },
      hard:   { best: null, attempts: 0 },
      hell:   { best: null, attempts: 0 },
    };
    for (const diff of DIFFICULTIES) {
      const diffScores = gameScores.filter(
        (s) => (s.difficulty as Difficulty) === diff
      );
      byDifficulty[diff].attempts = diffScores.length;
      if (diffScores.length > 0) {
        const values = diffScores.map((s) => s.value);
        byDifficulty[diff].best = g.lowerIsBetter
          ? Math.min(...values)
          : Math.max(...values);
      }
    }

    // Last 30 attempts across all difficulties, oldest→newest for mini-chart
    const history = gameScores
      .slice(0, 30)
      .reverse()
      .map((s) => ({
        value: s.value,
        difficulty: s.difficulty as Difficulty,
        createdAt: s.createdAt,
      }));

    return {
      game: g.id as GameId,
      totalAttempts: gameScores.length,
      byDifficulty,
      history,
    };
  });

  // ── Recent activity (last 20 attempts) ─────────────────────────────────────
  const recent = all.slice(0, 20).map((s) => ({
    game: s.game as GameId,
    difficulty: s.difficulty as Difficulty,
    value: s.value,
    createdAt: s.createdAt,
  }));

  return NextResponse.json({
    summary: { totalAttempts, gamesPlayed, firstPlayedAt, daysActive },
    byGame,
    recent,
  });
}
