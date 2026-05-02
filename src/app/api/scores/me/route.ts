import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GAMES } from "@/lib/utils";

// GET /api/scores/me — current user's best scores per game
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const results = await Promise.all(
    GAMES.map(async (game) => {
      const best = await prisma.score.findFirst({
        where: { userId: session.user.id, game: game.id },
        orderBy: { value: game.lowerIsBetter ? "asc" : "desc" },
      });
      const count = await prisma.score.count({
        where: { userId: session.user.id, game: game.id },
      });
      return { game: game.id, best: best?.value ?? null, attempts: count };
    })
  );

  return NextResponse.json({ scores: results });
}
