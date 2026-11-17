import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MiniGameShell } from "@/components/MiniGameShell";
import { getMiniGame, MINI_GAMES } from "@/lib/mini-games";
import { isLang } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { lang: string; slug: string };

export function generateStaticParams() {
  return MINI_GAMES.map(({ slug }) => ({ slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  return isLang(params.lang) && getMiniGame(params.slug) ? pageMetadata(params.lang, `/games/minigames/${params.slug}`) : {};
}

export default function MiniGamePage({ params }: { params: Params }) {
  const game = getMiniGame(params.slug);
  if (!game) notFound();
  return <MiniGameShell game={game} />;
}
