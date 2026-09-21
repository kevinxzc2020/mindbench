"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Brain, Gamepad2, Play, Sparkles, Trophy } from "lucide-react";
import { GAMES, CATEGORY_INFO, getGamesByCategory, type GameCategory } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import { GAME_ICONS, CATEGORY_ICONS, MystIcons } from "@/lib/icons";

const CATEGORIES: GameCategory[] = ["cognitive", "puzzle", "moba", "casual"];
const VISIBLE_GAMES = GAMES.filter((game) => !("hidden" in game && game.hidden));
const GROUPS = getGamesByCategory();
const COPY = {
  en: {
    eyebrow: "THE MINDBENCH ARCADE",
    title: "Pick a game. Challenge yourself.",
    intro: "Reaction, memory, puzzles & more. Choose a card and jump in.",
    all: "All games", play: "Play now", available: "games to play",
    filter: "Filter games", extra: "Something different?",
    extraDesc: "Explore how you think, feel, and see the world.",
    iq: "IQ Test", iqDesc: "Explore five dimensions of your thinking.",
    explore: "Explore", noAccount: "Play first. Log in to save your scores.",
  },
  zh: {
    eyebrow: "MINDBENCH · 游戏大厅",
    title: "选一个游戏，挑战一下自己。",
    intro: "反应、记忆、解谜与休闲小游戏，点开就能玩。",
    all: "全部游戏", play: "开始玩", available: "款游戏可玩",
    filter: "筛选游戏", extra: "想试点不一样的？",
    extraDesc: "探索你的思维、性格与好奇心。",
    iq: "IQ 测试", iqDesc: "从五个维度探索你的思维方式。",
    explore: "去探索", noAccount: "直接开玩，登录后可保存成绩。",
  },
  es: {
    eyebrow: "LA SALA DE MINDBENCH",
    title: "Elige un juego. Ponte a prueba.",
    intro: "Reacción, memoria, lógica y más. Elige y empieza a jugar.",
    all: "Todos", play: "Jugar", available: "juegos disponibles",
    filter: "Filtrar juegos", extra: "¿Algo diferente?",
    extraDesc: "Explora cómo piensas, sientes y ves el mundo.",
    iq: "Test de IQ", iqDesc: "Explora cinco dimensiones de tu pensamiento.",
    explore: "Explorar", noAccount: "Juega ahora. Inicia sesión para guardar tus resultados.",
  },
};

export default function HomePage() {
  const { t, lang } = useLang();
  const copy = COPY[lang];
  const [category, setCategory] = useState<"all" | GameCategory>("all");
  const games = VISIBLE_GAMES.filter((game) => category === "all" || game.category === category);
  const extras = [
    { href: "/iq-test", title: copy.iq, description: copy.iqDesc, Icon: Brain },
    { href: "/mbti", title: t.mbtiTitle, description: t.mbtiDesc, Icon: MystIcons.Mbti },
    { href: "/tarot", title: t.tarotTitle, description: t.tarotDesc, Icon: MystIcons.Tarot },
  ];

  return (
    <div className="arcade-shell">
      <section className="arcade-intro" aria-labelledby="arcade-title">
        <div>
          <p className="arcade-eyebrow"><span />{copy.eyebrow}</p>
          <h1 id="arcade-title">{copy.title}</h1>
          <p className="arcade-description">{copy.intro}</p>
        </div>
        <Link href="/leaderboard" className="arcade-leaderboard">
          <Trophy size={16} />{t.leaderboard}<ArrowUpRight size={15} />
        </Link>
      </section>

      <section aria-label={copy.all}>
        <div className="arcade-toolbar">
          <div className="arcade-filters" role="group" aria-label={copy.filter}>
            <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
              <Gamepad2 size={16} />{copy.all}<span>{VISIBLE_GAMES.length}</span>
            </button>
            {CATEGORIES.filter((cat) => GROUPS[cat].length > 0).map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button key={cat} type="button" aria-pressed={category === cat} onClick={() => setCategory(cat)}>
                  <Icon size={16} />{t[CATEGORY_INFO[cat].titleKey]}<span>{GROUPS[cat].length}</span>
                </button>
              );
            })}
          </div>
          <span className="arcade-count" role="status">{games.length} {copy.available}</span>
        </div>

        {CATEGORIES.filter((cat) => GROUPS[cat].length > 0 && (category === "all" || category === cat)).map((cat) => {
          const CategoryIcon = CATEGORY_ICONS[cat];
          return (
          <section key={cat} className={`arcade-group arcade-group-${cat}`} aria-labelledby={`category-${cat}`}>
            <div className="arcade-group-heading">
              <CategoryIcon size={19} aria-hidden="true" />
              <h2 id={`category-${cat}`}>{t[CATEGORY_INFO[cat].titleKey]}</h2>
              <span>{GROUPS[cat].length} {copy.available}</span>
            </div>
            <div className="arcade-grid">
          {GROUPS[cat].map((game) => {
            const Icon = GAME_ICONS[game.id];
            return (
              <Link key={game.id} href={`/games/${game.id}`} className={`arcade-card arcade-card-${game.category}`}>
                <div className="arcade-card-top">
                  <span className="arcade-game-icon"><Icon size={31} strokeWidth={1.7} /></span>
                  <span className="arcade-category">{t[CATEGORY_INFO[game.category].titleKey]}</span>
                </div>
                <h3>{t[game.titleKey]}</h3>
                <p>{t[game.descKey]}</p>
                <span className="arcade-play"><Play size={12} fill="currentColor" />{copy.play}<ArrowUpRight size={15} /></span>
              </Link>
            );
          })}
            </div>
          </section>
          );
        })}
        <p className="arcade-account-note">{copy.noAccount}</p>
      </section>

      <section className="arcade-extras" aria-labelledby="extras-title">
        <div className="arcade-extras-heading">
          <Sparkles size={18} />
          <h2 id="extras-title">{copy.extra}</h2>
          <p>{copy.extraDesc}</p>
        </div>
        <div className="arcade-extras-grid">
          {extras.map(({ href, title, description, Icon }) => (
            <Link href={href} key={href} className="arcade-extra">
              <Icon size={26} strokeWidth={1.6} />
              <div><h3>{title}</h3><p>{description}</p></div>
              <ArrowUpRight size={18} aria-label={copy.explore} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
