import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GAMES, type GameId } from "@/lib/utils";
import { DIFFICULTIES, DEFAULT_DIFFICULTY, type Difficulty } from "@/lib/difficulty";

// POST /api/scores — submit a new score
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { game, value, difficulty } = await req.json();

  const validGames = GAMES.map((g) => g.id);
  if (!validGames.includes(game)) {
    return NextResponse.json({ error: "无效游戏" }, { status: 400 });
  }
  if (typeof value !== "number" || value < 0) {
    return NextResponse.json({ error: "无效分数" }, { status: 400 });
  }

  // Validate difficulty (fall back to default if missing/invalid — legacy clients)
  const diff: Difficulty = DIFFICULTIES.includes(difficulty)
    ? difficulty
    : DEFAULT_DIFFICULTY;

  const score = await prisma.score.create({
    data: { userId: session.user.id, game, value, difficulty: diff },
  });

  return NextResponse.json({ score }, { status: 201 });
}

// GET /api/scores?game=reaction-time&difficulty=medium — leaderboard
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") as GameId | null;
  const difficultyParam = searchParams.get("difficulty");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

  if (!game) {
    return NextResponse.json({ error: "缺少 game 参数" }, { status: 400 });
  }

  const gameInfo = GAMES.find((g) => g.id === game);
  if (!gameInfo) {
    return NextResponse.json({ error: "无效游戏" }, { status: 400 });
  }

  // Validate difficulty (default to medium)
  const difficulty: Difficulty = DIFFICULTIES.includes(difficultyParam as Difficulty)
    ? (difficultyParam as Difficulty)
    : DEFAULT_DIFFICULTY;

  // Get best score per user for that game + difficulty
  const raw = await prisma.score.findMany({
    where: { game, difficulty },
    orderBy: { value: gameInfo.lowerIsBetter ? "asc" : "desc" },
    include: { user: { select: { id: true, name: true } } },
    take: limit * 5, // Fetch more, deduplicate below
  });

  // Keep only best score per user
  const seen = new Set<string>();
  const leaderboard = raw
    .filter((s) => {
      if (seen.has(s.userId)) return false;
      seen.add(s.userId);
      return true;
    })
    .slice(0, limit)
    .map((s, i) => ({
      rank: i + 1,
      userId: s.userId,
      userName: s.user.name ?? "匿名",
      value: s.value,
      createdAt: s.createdAt,
    }));

  return NextResponse.json({ leaderboard, difficulty });
}
