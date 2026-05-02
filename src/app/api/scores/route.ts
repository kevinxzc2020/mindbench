import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GAMES, type GameId } from "@/lib/utils";
import { DIFFICULTIES, DEFAULT_DIFFICULTY, type Difficulty } from "@/lib/difficulty";
import { generateFakeLeaderboard } from "@/lib/leaderboard-fixtures";

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
    if (typeof value !== "number" || value < 0) {
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

  // ── 1) 真实分数 ─────────────────────────────────────────────────────────
  // 拉一批（每用户每难度最好成绩），下面去重。数据库挂掉时仍然给出合成榜单。
  type Entry = {
    userId: string;
    userName: string;
    value: number;
    createdAt: Date;
    synthetic: boolean;
  };
  let realEntries: Entry[] = [];
  try {
    const realRaw = await prisma.score.findMany({
      where: { game, difficulty },
      orderBy: { value: gameInfo.lowerIsBetter ? "asc" : "desc" },
      include: { user: { select: { id: true, name: true } } },
      take: 500,
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
  }

  // ── 2) 合成分数 ─────────────────────────────────────────────────────────
  const fake = generateFakeLeaderboard(game, difficulty);

  // ── 3) 合并 + 排序 + 截断 ───────────────────────────────────────────────
  const merged = [...realEntries, ...fake].sort((a, b) =>
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
