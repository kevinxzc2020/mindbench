import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GAMES, type GameId } from "@/lib/utils";
import { DIFFICULTIES, DEFAULT_DIFFICULTY, type Difficulty } from "@/lib/difficulty";

// POST /api/scores — submit a new score
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn("[scores POST] no session — user not logged in");
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    const { game, value, difficulty } = body;

    const validGames = GAMES.map((g) => g.id);
    if (!validGames.includes(game)) {
      console.warn("[scores POST] invalid game:", game);
      return NextResponse.json(
        { error: `无效游戏: ${game}` },
        { status: 400 }
      );
    }
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      console.warn("[scores POST] invalid value:", value);
      return NextResponse.json(
        { error: `无效分数: ${value}` },
        { status: 400 }
      );
    }

    // Validate difficulty (fall back to default if missing/invalid — legacy clients)
    const diff: Difficulty = DIFFICULTIES.includes(difficulty)
      ? difficulty
      : DEFAULT_DIFFICULTY;

    const score = await prisma.score.create({
      data: { userId: session.user.id, game, value, difficulty: diff },
    });

    console.log(
      `[scores POST] saved ${game}/${diff}=${value} for user ${session.user.id}`
    );
    return NextResponse.json({ score }, { status: 201 });
  } catch (err) {
    // Surface Prisma errors so the user can diagnose (e.g., schema out of sync)
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[scores POST] DB error:", msg);
    return NextResponse.json(
      { error: `Save failed: ${msg}` },
      { status: 500 }
    );
  }
}

// GET /api/scores?game=reaction-time&difficulty=medium — leaderboard
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") as GameId | null;
  const difficultyParam = searchParams.get("difficulty");
  const requestedLimit = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(Math.floor(requestedLimit), 100)) : 20;

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

  // ── 1) 真实分数 ─────────────────────────────────────────────────────────
  // Rank actual submitted personal bests only. Failure must never fabricate players.
  type Entry = {
    userId: string;
    userName: string;
    value: number;
    createdAt: Date;
    synthetic: boolean;
  };
  let realEntries: Entry[] = [];
  try {
    const bestScores = await prisma.score.groupBy({
      by: ["userId"], where: { game, difficulty },
      _min: { value: true }, _max: { value: true },
      orderBy: gameInfo.lowerIsBetter ? { _min: { value: "asc" } } : { _max: { value: "desc" } },
      take: limit,
    });
    const realRaw = await prisma.score.findMany({
      orderBy: { value: gameInfo.lowerIsBetter ? "asc" : "desc" },
      include: { user: { select: { id: true, name: true } } },
      where: { game, difficulty, OR: bestScores.map((s) => ({ userId: s.userId, value: (gameInfo.lowerIsBetter ? s._min.value : s._max.value)! })) },
    });
    const seen = new Set<string>();
    realEntries = realRaw
      .filter((s) => {
        if (seen.has(s.userId)) return false;
        seen.add(s.userId);
        return true;
      })
      .map<Entry>((s) => ({
        userId: s.userId,
        userName: s.user.name ?? "匿名",
        value: s.value,
        createdAt: s.createdAt,
        synthetic: false,
      }));
  } catch (err) {
    console.error("[scores GET] DB error:", err);
    return NextResponse.json({ error: "Leaderboard unavailable" }, { status: 503 });
  }

  // Sort and truncate real entries.
  const merged = realEntries.sort((a, b) =>
    gameInfo.lowerIsBetter ? a.value - b.value : b.value - a.value
  );

  const leaderboard = merged.slice(0, limit).map((e, i) => ({
    rank: i + 1,
    userId: e.userId,
    userName: e.userName,
    value: e.value,
    createdAt: e.createdAt,
    synthetic: e.synthetic,
  }));

  return NextResponse.json({ leaderboard, difficulty });
}
