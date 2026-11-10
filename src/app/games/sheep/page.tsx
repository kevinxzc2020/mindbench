"use client";

import { MiniGameShell } from "@/components/MiniGameShell";
import type { MiniGameDefinition } from "@/lib/mini-games";

const game: MiniGameDefinition = {
  id: "sheep-planet", slug: "sheep", sourcePath: "/sheep-game/index.html",
  title: { en: "Bunny Match", zh: "兔了个兔", es: "Tríos de conejos" },
  description: { en: "Uncover the stack and clear three matching tiles at a time.", zh: "逐层揭开卡牌，每次凑齐三个相同图案。", es: "Descubre la pila y reúne tres fichas iguales." },
  instructions: { en: "Tap an uncovered tile to move it to the tray. Three matching tiles clear together. Keep the seven-slot tray from filling up.", zh: "点击未被遮挡的卡牌放入暂存槽。三个相同图案会自动消除，别让七个槽位全部占满。", es: "Toca una ficha libre para moverla a la bandeja. Tres iguales se eliminan. No llenes las siete casillas." },
  tag: { en: "MATCH / LAYERS", zh: "消除 / 层叠", es: "TRÍOS / CAPAS" },
};

export default function SheepPage() {
  return <MiniGameShell game={game} sourceLabel="SOURCE: CHENXCH" rewarded={false} />;
}
