"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { useLang } from "@/lib/language-context";
import type { MiniGameDefinition } from "@/lib/mini-games";
import { RewardedRevive } from "./RewardedRevive";
import styles from "./MiniGameShell.module.css";

const COPY = {
  en: { back: "Back to games", imported: "IMPORTED PLAYABLE", source: "SOURCE: MINIGAME-EVERYDAY", guideEyebrow: "PLAY BRIEF", guideTitle: "Make one clean move.", input: "INPUT", inputValue: "Tap or click", status: "SCORE", statusValue: "Not on leaderboard yet", note: "Runs in an isolated game frame. Scores from this imported set are not connected to the MindBench leaderboard yet.", leaderboard: "View leaderboard" },
  zh: { back: "返回游戏合集", imported: "已植入 · 可直接游玩", source: "来源：MINIGAME-EVERYDAY", guideEyebrow: "玩法说明", guideTitle: "看清棋盘，再走一步。", input: "操作", inputValue: "点击或触控", status: "成绩", statusValue: "暂未接入排行榜", note: "游戏在独立画布中运行。该仓库小游戏目前尚未接入 MindBench 排行榜计分。", leaderboard: "查看现有排行榜" },
  es: { back: "Volver a los juegos", imported: "JUGABLE IMPORTADO", source: "FUENTE: MINIGAME-EVERYDAY", guideEyebrow: "GUÍA DE JUEGO", guideTitle: "Un movimiento limpio.", input: "CONTROL", inputValue: "Toca o haz clic", status: "PUNTUACIÓN", statusValue: "Aún no está en la clasificación", note: "Se ejecuta en un marco de juego aislado. Sus puntuaciones aún no están conectadas a la clasificación de MindBench.", leaderboard: "Ver clasificación" },
};

export function MiniGameShell({ game }: { game: MiniGameDefinition }) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <article className={styles.page}>
      <Link href="/#games" className={styles.back}><ArrowLeft size={14} aria-hidden="true" />{copy.back}</Link>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}><span />{game.tag[lang]}</p>
          <h1 className={styles.title}>{game.title[lang]}</h1>
          <p className={styles.description}>{game.description[lang]}</p>
        </div>
        <div className={styles.meta}>
          <span>{copy.imported}</span>
          <span className={styles.source}>{copy.source}</span>
        </div>
      </header>
      <div className={styles.playLayout}>
        <section className={styles.frame} aria-label={game.title[lang]}>
          <div className={styles.frameBar}><strong>{game.title[lang]}</strong><span>MINDBENCH / PLAY LAB</span></div>
          <iframe ref={iframeRef} src={`${game.sourcePath}?lang=${lang}`} title={game.title[lang]} allow="fullscreen; gamepad" allowFullScreen scrolling="no" />
          <RewardedRevive gameId={game.slug} iframeRef={iframeRef} />
        </section>
        <aside className={styles.guide} aria-label={copy.guideEyebrow}>
          <p className={styles.guideEyebrow}>{copy.guideEyebrow}</p>
          <h2 className={styles.guideTitle}>{copy.guideTitle}</h2>
          <p className={styles.guideText}>{game.instructions[lang]}</p>
          <dl className={styles.guideMeta}>
            <div><dt>{copy.input}</dt><dd>{copy.inputValue}</dd></div>
            <div><dt>{copy.status}</dt><dd>{copy.statusValue}</dd></div>
          </dl>
        </aside>
      </div>
      <p className={styles.note}>{copy.note} <Link href="/leaderboard">{copy.leaderboard}<ArrowUpRight size={12} aria-hidden="true" /></Link></p>
    </article>
  );
}
