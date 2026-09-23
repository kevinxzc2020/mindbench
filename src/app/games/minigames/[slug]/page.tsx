import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MiniGameShell } from "@/components/MiniGameShell";
import { getMiniGame, MINI_GAMES } from "@/lib/mini-games";

export function generateStaticParams() {
  return MINI_GAMES.map(({ slug }) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const game = getMiniGame(params.slug);
  return game ? { title: `${game.title.en} | MindBench` } : { title: "Mini game | MindBench" };
}

export default function MiniGamePage({ params }: { params: { slug: string } }) {
  const game = getMiniGame(params.slug);
  if (!game) notFound();
  return <MiniGameShell game={game} />;
}
