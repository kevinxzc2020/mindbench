"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, ChevronRight, Info, RotateCcw, Trophy } from "lucide-react";
import { CATEGORY_INFO, GAMES, formatScore, getGamesByCategory, type GameCategory, type GameId } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import { DIFFICULTIES, DEFAULT_DIFFICULTY, type Difficulty } from "@/lib/difficulty";
import { GAME_ICONS, DIFFICULTY_LUCIDE_ICONS } from "@/lib/icons";
import { UserAvatar } from "@/components/UserAvatar";
import styles from "./leaderboard.module.css";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  value: number;
  createdAt: string;
  synthetic?: boolean;
}

type BoardResult = {
  key: string;
  status: "loading" | "ready" | "error";
  entries: LeaderboardEntry[];
};

const VISIBLE_GAMES = GAMES.filter((game) => !("hidden" in game && game.hidden));
const GROUPS = getGamesByCategory();
const CATEGORIES: GameCategory[] = ["cognitive", "puzzle", "moba", "casual"];
const COPY = {
  en: {
    eyebrow: "THE SCOREBOARD", intro: "A little friendly competition. A reason to try again.",
    games: "Games", difficulties: "Difficulty levels", catalogue: "Explore all games", select: "Choose your game",
    challenge: "THE CHALLENGE", play: "Take your turn", difficulty: "Difficulty", rank: "Rank", player: "Player", score: "Best score",
    results: "Rankings", shown: "entries shown", demo: "Demo", demoNote: "This board includes generated demo entries, marked below. These are not real player results.",
    error: "The scoreboard couldn't be loaded.", errorDetail: "Your scores haven't been changed. Try loading this board again.", retry: "Try again",
    end: "Your next attempt starts here.", endNote: "Play freely. Log in to save your best.", register: "Create an account", top: "First place",
  },
  zh: {
    eyebrow: "每一次尝试，都值得记录", intro: "来一场友好的较量，也给自己一个再试一次的理由。",
    games: "款游戏", difficulties: "档难度", catalogue: "探索全部游戏", select: "选择游戏",
    challenge: "当前挑战", play: "轮到你了", difficulty: "挑战难度", rank: "排名", player: "玩家", score: "最佳成绩",
    results: "成绩榜", shown: "条成绩", demo: "演示", demoNote: "此榜单包含系统生成的演示数据，已逐条标注；演示成绩不代表真实玩家成绩。",
    error: "排行榜暂时加载失败。", errorDetail: "你的成绩没有被修改，请重试加载。", retry: "重新加载",
    end: "下一次突破，从这里开始。", endNote: "直接开玩，登录后保存你的最佳成绩。", register: "创建账号", top: "第一名",
  },
  es: {
    eyebrow: "EL MARCADOR", intro: "Un poco de competición amistosa. Un motivo para volver a intentarlo.",
    games: "Juegos", difficulties: "Niveles de dificultad", catalogue: "Explorar juegos", select: "Elige un juego",
    challenge: "EL DESAFÍO", play: "Es tu turno", difficulty: "Dificultad", rank: "Puesto", player: "Jugador", score: "Mejor resultado",
    results: "Resultados", shown: "resultados mostrados", demo: "Demo", demoNote: "Esta tabla incluye ejemplos generados, identificados abajo. No son resultados de jugadores reales.",
    error: "No se pudo cargar la clasificación.", errorDetail: "Tus resultados no han cambiado. Vuelve a cargar la tabla.", retry: "Reintentar",
    end: "Tu próximo intento empieza aquí.", endNote: "Juega libremente. Inicia sesión para guardar tu mejor resultado.", register: "Crear cuenta", top: "Primer puesto",
  },
};

export default function LeaderboardPage() {
  const { t, lang } = useLang();
  const copy = COPY[lang];
  const [activeGame, setActiveGame] = useState<GameId>("reaction-time");
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>(DEFAULT_DIFFICULTY);
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${activeGame}/${activeDifficulty}/${attempt}`;
  const [result, setResult] = useState<BoardResult>({ key: "", status: "loading", entries: [] });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    // A stalled request should become a recoverable error, not an endless skeleton.
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setResult({ key: requestKey, status: "loading", entries: [] });

    async function loadBoard() {
      try {
        const response = await fetch(`/api/scores?game=${activeGame}&difficulty=${activeDifficulty}&limit=20`, { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load leaderboard");
        const payload = await response.json();
        if (!Array.isArray(payload.leaderboard)) throw new Error("Invalid leaderboard response");
        if (!cancelled) setResult({ key: requestKey, status: "ready", entries: payload.leaderboard });
      } catch {
        if (!cancelled) setResult({ key: requestKey, status: "error", entries: [] });
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void loadBoard();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [activeGame, activeDifficulty, requestKey]);

  // Never paint the previous game's scores underneath a newly selected heading.
  const status = result.key === requestKey ? result.status : "loading";
  const entries = status === "ready" ? result.entries : [];
  const hasDemo = entries.some((entry) => entry.synthetic);
  const game = VISIBLE_GAMES.find((item) => item.id === activeGame)!;
  const GameIcon = GAME_ICONS[activeGame];
  const DirectionIcon = game.lowerIsBetter ? ArrowDown : ArrowUp;
  const diffLabel: Record<Difficulty, string> = {
    easy: t.difficultyEasy, medium: t.difficultyMedium, hard: t.difficultyHard, hell: t.difficultyHell,
  };

  return (
    <div className={styles.page} data-language={lang}>
      <header className={styles.hero}>
        <div className={styles.eyebrow}><span /> MINDBENCH / {copy.eyebrow}</div>
        <div className={styles.heroBody}>
          <h1>{t.lbTitle}<span aria-hidden="true">↗</span></h1>
          <div className={styles.heroAside}><p>{copy.intro}</p><Link href="/#games">{copy.catalogue}<ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        </div>
        <div className={styles.heroMeta}>
          <span><strong>{String(VISIBLE_GAMES.length).padStart(2, "0")}</strong> {copy.games}</span>
          <span><strong>{String(DIFFICULTIES.length).padStart(2, "0")}</strong> {copy.difficulties}</span>
          <span className={styles.heroMotto}>PLAY. OUTTHINK. REPEAT.</span>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.sidebar} aria-label={copy.select}>
          <div className={styles.sidebarTitle}><span>/ 01</span><h2>{copy.select}</h2></div>
          <div className={styles.desktopGames}>
            {CATEGORIES.filter((category) => GROUPS[category].length > 0).map((category) => (
              <section className={styles.gameGroup} key={category} aria-labelledby={`lb-category-${category}`}>
                <h3 id={`lb-category-${category}`}>{t[CATEGORY_INFO[category].titleKey]}<span>{String(GROUPS[category].length).padStart(2, "0")}</span></h3>
                {GROUPS[category].map((item) => {
                  const Icon = GAME_ICONS[item.id];
                  return <button key={item.id} type="button" aria-pressed={activeGame === item.id} onClick={() => setActiveGame(item.id)}><Icon size={16} aria-hidden="true" /><span>{t[item.titleKey]}</span><ChevronRight size={13} aria-hidden="true" /></button>;
                })}
              </section>
            ))}
          </div>
          <label className={styles.mobileGames}>
            <span className="sr-only">{copy.select}</span>
            <select value={activeGame} onChange={(event) => setActiveGame(event.target.value as GameId)}>
              {CATEGORIES.filter((category) => GROUPS[category].length > 0).map((category) => (
                <optgroup key={category} label={t[CATEGORY_INFO[category].titleKey]}>{GROUPS[category].map((item) => <option key={item.id} value={item.id}>{t[item.titleKey]}</option>)}</optgroup>
              ))}
            </select>
          </label>
        </aside>

        <section className={styles.board} aria-labelledby="lb-game-title">
          <div className={styles.challenge} key={activeGame}>
            <GameIcon className={styles.challengeArt} size={144} strokeWidth={.65} aria-hidden="true" />
            <div className={styles.challengeCopy}>
              <p className={styles.sectionLabel}>/ 02 <span>{copy.challenge}</span></p>
              <h2 id="lb-game-title">{t[game.titleKey]}</h2>
              <p className={styles.gameDescription}>{t[game.descKey]}</p>
              <Link href={`/games/${activeGame}`} className={styles.playLink}>{copy.play}<ArrowUpRight size={19} aria-hidden="true" /></Link>
            </div>
            <span className={styles.challengeIndex} aria-hidden="true">{String(VISIBLE_GAMES.indexOf(game) + 1).padStart(2, "0")}</span>
          </div>

          <div className={styles.difficultyBar}>
            <span className={styles.controlLabel}>{copy.difficulty}</span>
            <div className={styles.difficultyOptions} role="group" aria-label={copy.difficulty}>
              {DIFFICULTIES.map((difficulty, index) => {
                const Icon = DIFFICULTY_LUCIDE_ICONS[difficulty];
                return <button key={difficulty} type="button" aria-pressed={activeDifficulty === difficulty} onClick={() => setActiveDifficulty(difficulty)}><span className={styles.difficultyIndex}>0{index + 1}</span><Icon size={14} aria-hidden="true" />{diffLabel[difficulty]}</button>;
              })}
            </div>
          </div>

          <div className={styles.tableHeading}>
            <h3>{copy.results}<span> / {diffLabel[activeDifficulty]}</span></h3>
            <span><DirectionIcon size={13} aria-hidden="true" />{game.lowerIsBetter ? t.lbLower : t.lbHigher}</span>
          </div>
          <p className="sr-only" role="status">{status === "loading" ? t.loading : status === "ready" ? `${t[game.titleKey]} · ${diffLabel[activeDifficulty]} · ${entries.length} ${copy.shown}` : ""}</p>

          {hasDemo && <p className={styles.demoNotice}><Info size={15} aria-hidden="true" /><span>{copy.demoNote}</span></p>}

          <div className={styles.results} aria-busy={status === "loading"}>
            {status === "loading" ? (
              <div className={styles.loading} aria-label={t.loading}>
                <div className={styles.loadingLabel}>{t.loading}</div>
                {Array.from({ length: 6 }, (_, index) => <div className={styles.skeletonRow} key={index} aria-hidden="true"><i /><span /><b /></div>)}
              </div>
            ) : status === "error" ? (
              <div className={styles.message} role="alert"><Info size={28} /><h4>{copy.error}</h4><p>{copy.errorDetail}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}><RotateCcw size={15} />{copy.retry}</button></div>
            ) : entries.length === 0 ? (
              <div className={styles.message}><Trophy size={32} aria-hidden="true" /><h4>{t.lbEmpty}</h4><Link href={`/games/${activeGame}`}>{copy.play}<ArrowUpRight size={17} /></Link></div>
            ) : (
              <table className={styles.table} key={requestKey}>
                <caption className="sr-only">{t[game.titleKey]} — {diffLabel[activeDifficulty]} — {t.lbBest}</caption>
                <thead><tr><th scope="col">{copy.rank}</th><th scope="col">{copy.player}</th><th scope="col">{copy.score}</th></tr></thead>
                <tbody>{entries.map((entry, index) => (
                  <tr key={entry.userId} data-leading={entry.rank === 1 || undefined} style={{ "--row-order": Math.min(index, 7) } as CSSProperties}>
                    <td className={styles.rank}><span>{String(entry.rank).padStart(2, "0")}</span>{entry.rank === 1 && <Trophy size={14} aria-label={copy.top} />}</td>
                    <th scope="row"><div className={styles.player}><UserAvatar userId={entry.userId} name={entry.userName} size={34} variant="neutral" className={styles.avatar} /><div className={styles.playerIdentity}><span className={styles.playerName} title={entry.userName}>{entry.userName}</span>{entry.synthetic && <span className={styles.demoBadge}>{copy.demo}</span>}</div></div></th>
                    <td className={styles.score}>{formatScore(activeGame, entry.value, t)}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
          <div className={styles.tableFoot}><p>{t.lbBest}</p>{status === "ready" && <span>{String(entries.length).padStart(2, "0")} {copy.shown}</span>}</div>
        </section>
      </div>

      <section className={styles.outro}>
        <div><p className={styles.sectionLabel}>/ NEXT</p><h2>{copy.end}</h2><p>{copy.endNote}</p></div>
        <Link href="/register">{copy.register}<ArrowUpRight size={20} aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
