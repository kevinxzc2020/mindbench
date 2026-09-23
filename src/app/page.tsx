"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUpRight, Brain, RotateCcw, Trophy } from "lucide-react";
import { GAMES, CATEGORY_INFO, getGamesByCategory, type GameCategory } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import { MystIcons } from "@/lib/icons";
import { AdSenseBanner } from "@/components/AdSenseBanner";
import { GameCover } from "@/components/GameCover";
import { HomeMotion, ScrambleText } from "@/components/HomeMotion";
import { MiniGamePreview } from "@/components/MiniGamePreview";
import { MINI_GAMES } from "@/lib/mini-games";

const CATEGORIES: GameCategory[] = ["cognitive", "puzzle", "moba", "casual"];
const VISIBLE_GAMES = GAMES.filter((game) => !("hidden" in game && game.hidden));
const GROUPS = getGamesByCategory();
const COPY = {
  en: {
    eyebrow: "A PLAYGROUND FOR YOUR MIND", title: ["PLAY.", "OUTTHINK.", "REPEAT."], replay: "Replay effect", motionOn: "Enable effects", motionOff: "Disable effects",
    intro: "Test your reflexes. Trust your memory. Make your next move.",
    start: "Test your reaction", browse: "Explore games", all: "All games", play: "Play", available: "games",
    filter: "Filter games", collection: "THE GAME COLLECTION", extra: "Follow your curiosity.",
    extraDesc: "A different side of MindBench. Step outside the score.",
    iq: "IQ Test", iqDesc: "Explore five dimensions of your thinking.",
    explore: "Explore", noAccount: "No sign-up needed to play. Log in to save your scores.",
    free: "PICK A GAME. MAKE IT YOURS.", cognitive: "Reflexes, recall, precision. Find your edge.",
    puzzle: "One move at a time. Think it through.", casual: "A little less serious. Just as hard to put down.", moba: "Practice your next move.",
    miniTitle: "A new game every day.", miniDesc: "Small experiments from an independent game-making streak.", miniPlay: "Play imported game",
  },
  zh: {
    eyebrow: "给大脑一个游乐场", title: ["开玩。", "突破。", "再来。"], replay: "重播特效", motionOn: "开启动效", motionOff: "关闭动效",
    intro: "测一测反应，相信你的记忆，走出下一步。",
    start: "测测反应速度", browse: "探索全部游戏", all: "全部游戏", play: "开玩", available: "款游戏",
    filter: "筛选游戏", collection: "游戏合集", extra: "跟着好奇心走。",
    extraDesc: "分数之外，还有另一面的 MindBench。",
    iq: "IQ 测试", iqDesc: "从五个维度探索你的思维方式。",
    explore: "去探索", noAccount: "无需注册，直接开玩。登录后可保存成绩。",
    free: "选一个游戏，挑战一下自己。", cognitive: "反应、记忆、精准度，找到你的强项。",
    puzzle: "一步一步，想出答案。", casual: "轻松一点，也可以玩得很认真。", moba: "练好你的下一步。",
    miniTitle: "每天一个小游戏。", miniDesc: "来自独立创作挑战的六个轻量实验。", miniPlay: "开始游玩",
  },
  es: {
    eyebrow: "UN PATIO DE JUEGOS PARA TU MENTE", title: ["JUEGA.", "SUPÉRATE.", "REPITE."], replay: "Repetir efecto", motionOn: "Activar efectos", motionOff: "Desactivar efectos",
    intro: "Pon a prueba tus reflejos. Confía en tu memoria. Haz tu próxima jugada.",
    start: "Prueba tus reflejos", browse: "Explorar juegos", all: "Todos", play: "Jugar", available: "juegos",
    filter: "Filtrar juegos", collection: "LA COLECCIÓN", extra: "Sigue tu curiosidad.",
    extraDesc: "Otro lado de MindBench. Más allá de la puntuación.",
    iq: "Test de IQ", iqDesc: "Explora cinco dimensiones de tu pensamiento.",
    explore: "Explorar", noAccount: "Juega sin registrarte. Inicia sesión para guardar tus resultados.",
    free: "ELIGE UN JUEGO. HAZLO TUYO.", cognitive: "Reflejos, memoria, precisión. Descubre tu habilidad.",
    puzzle: "Un movimiento a la vez. Piénsalo bien.", casual: "Menos serio. Igual de difícil de dejar.", moba: "Practica tu próxima jugada.",
    miniTitle: "Un juego nuevo cada día.", miniDesc: "Seis pequeños experimentos de una racha de creación independiente.", miniPlay: "Jugar juego importado",
  },
};

export default function HomePage() {
  const { t, lang } = useLang();
  const copy = COPY[lang];
  const [category, setCategory] = useState<"all" | GameCategory>("all");
  const [motionEnabled, setMotionEnabled] = useState(true);
  const games = VISIBLE_GAMES.filter((game) => category === "all" || game.category === category);
  const extras = [
    { href: "/iq-test", title: copy.iq, description: copy.iqDesc, Icon: Brain, mark: "IQ" },
    { href: "/mbti", title: t.mbtiTitle, description: t.mbtiDesc, Icon: MystIcons.Mbti, mark: "ME" },
    { href: "/tarot", title: t.tarotTitle, description: t.tarotDesc, Icon: MystIcons.Tarot, mark: "?" },
  ];
  return (
    <HomeMotion language={lang} category={category} enabled={motionEnabled}>
      <section className="studio-hero" aria-labelledby="studio-title">
        <Image src="/images/arcade-still-life-v2.png" alt="" fill priority sizes="100vw" className="studio-hero-image" />
        <canvas className="studio-pixel-canvas" aria-hidden="true" />
        <div className="studio-image-trail" aria-hidden="true" />
        <div className="studio-hero-shade" />
        <div className="studio-hero-content">
          <p className="studio-eyebrow"><span />{copy.eyebrow}</p>
          <h1 id="studio-title" data-motion-heading data-scramble-trigger>{copy.title.map((line) => <ScrambleText key={line} text={line} />)}</h1>
          <p className="studio-intro">{copy.intro}</p>
          <div className="studio-hero-actions">
            <Link href="/games/reaction-time" className="studio-button">{copy.start}<ArrowUpRight size={18} /></Link>
            <a href="#games" className="studio-text-link">{copy.browse}<ArrowDown size={15} /></a>
          </div>
        </div>
        <div className="studio-hero-caption" aria-hidden="true"><span>MINDBENCH — PLAY LAB</span><span>REACTION / MEMORY / PRECISION</span></div>
        <div className="studio-motion-controls">
          <button type="button" className="studio-replay" data-replay-motion><RotateCcw size={12} />{copy.replay}</button>
          <button type="button" className="studio-motion-toggle" aria-pressed={motionEnabled} onClick={() => setMotionEnabled((enabled) => !enabled)}>{motionEnabled ? copy.motionOff : copy.motionOn}</button>
        </div>
      </section>
      <div className="studio-ad-band"><AdSenseBanner /></div>
      <section id="games" className="studio-catalogue" aria-label={copy.all}>
        <div className="studio-collection-heading" data-motion-heading data-scramble-trigger><span><ScrambleText text={copy.collection} /></span><span>{copy.free}</span></div>
        <div className="studio-toolbar">
          <div className="studio-filters" role="group" aria-label={copy.filter}>
            <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>{copy.all}<sup>{VISIBLE_GAMES.length}</sup></button>
            {CATEGORIES.filter((cat) => GROUPS[cat].length > 0).map((cat) => (
              <button key={cat} type="button" aria-pressed={category === cat} onClick={() => setCategory(cat)}>{t[CATEGORY_INFO[cat].titleKey]}<sup>{GROUPS[cat].length}</sup></button>
            ))}
          </div>
          <span className="studio-count" role="status" aria-live="polite">{String(games.length).padStart(2, "0")} {copy.available}</span>
        </div>
        {CATEGORIES.filter((cat) => GROUPS[cat].length > 0 && (category === "all" || category === cat)).map((cat) => (
          <section key={cat} className="studio-group" aria-labelledby={`category-${cat}`}>
            <div className="studio-group-heading" data-motion-heading data-scramble-trigger>
              <div><span className="studio-section-index">/ {String(CATEGORIES.filter((key) => GROUPS[key].length > 0).indexOf(cat) + 1).padStart(2, "0")}</span><h2 id={`category-${cat}`}><ScrambleText text={t[CATEGORY_INFO[cat].titleKey]} /></h2></div>
              <p>{copy[cat]}</p>
            </div>
            <div className="studio-grid">
              {GROUPS[cat].map((game) => (
                <Link key={game.id} href={`/games/${game.id}`} className="studio-game" data-motion-card>
                  <div className="studio-game-visual"><GameCover id={game.id} /><span className="studio-pixel-curtain" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <i key={index} />)}</span><span className="studio-game-number">{String(VISIBLE_GAMES.indexOf(game) + 1).padStart(2, "0")}</span><span className="studio-game-open"><ArrowUpRight size={21} /></span></div>
                  <div className="studio-game-info"><h3><ScrambleText text={t[game.titleKey]} /></h3><span>{copy.play}<ArrowUpRight size={14} /></span><p>{t[game.descKey]}</p></div>
                </Link>
              ))}
            </div>
          </section>
        ))}
        <div className="studio-account-note"><p>{copy.noAccount}</p><Link href="/leaderboard"><Trophy size={15} />{t.leaderboard}<ArrowUpRight size={15} /></Link></div>
      </section>
      <section className="studio-mini-catalogue" aria-labelledby="mini-games-title">
        <div className="studio-mini-heading" data-motion-heading data-scramble-trigger>
          <span className="studio-section-index">/ DAILY MINI-GAMES</span>
          <h2 id="mini-games-title"><ScrambleText text={copy.miniTitle} /></h2>
          <p>{copy.miniDesc}</p>
        </div>
        <div className="studio-mini-grid">
          {MINI_GAMES.map((miniGame, index) => (
            <Link key={miniGame.id} href={`/games/minigames/${miniGame.slug}`} className="studio-mini-game" data-motion-card>
              <MiniGamePreview id={miniGame.id} />
              <div className="studio-mini-copy"><span className="studio-mini-index">{String(index + 1).padStart(2, "0")}</span><div><span className="studio-mini-tag">{miniGame.tag[lang]}</span><h3>{miniGame.title[lang]}</h3><p>{miniGame.description[lang]}</p></div></div>
              <span className="studio-mini-action">{copy.miniPlay}<ArrowUpRight size={15} /></span>
            </Link>
          ))}
        </div>
      </section>
      <section className="studio-extras" aria-labelledby="extras-title">
        <div className="studio-extras-heading" data-motion-heading data-scramble-trigger><span className="studio-section-index">/ EXTRA</span><h2 id="extras-title"><ScrambleText text={copy.extra} /></h2><p>{copy.extraDesc}</p></div>
        <div className="studio-extra-grid">
          {extras.map(({ href, title, description, Icon, mark }) => (
            <Link href={href} key={href} className="studio-extra"><span className="studio-extra-mark" aria-hidden="true">{mark}</span><Icon size={24} strokeWidth={1.5} /><div><h3>{title}</h3><p>{description}</p></div><ArrowUpRight size={22} aria-label={copy.explore} /></Link>
          ))}
        </div>
      </section>
    </HomeMotion>
  );
}
