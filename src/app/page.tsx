"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Activity,
  ArrowUpRight,
  Brain,
  ChevronRight,
  Clock3,
  Gauge,
  LockKeyhole,
  Play,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import {
  GAMES,
  getGamesByCategory,
  CATEGORY_INFO,
  categoryCta,
  type GameCategory,
} from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import { BrainMark } from "@/components/BrainMark";
import { MagneticCard } from "@/components/MagneticCard";
import { GAME_ICONS, CATEGORY_ICONS, MystIcons } from "@/lib/icons";

const CATEGORY_ORDER: GameCategory[] = ["cognitive", "puzzle", "moba", "casual"];
const DIFFICULTY_TIERS = 4;
const SUPPORTED_LANGS = 3;

/** 滚动渐入：把所有 .reveal 子元素挂上 IntersectionObserver */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)");
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "-50px 0px", threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function HeroSignalVisual() {
  return (
    <div className="hero-signal" aria-label="MindBench cognitive signal dashboard">
      <div className="hero-signal-header">
        <div className="hero-signal-label">
          <span className="signal-pulse" />
          LIVE COGNITIVE SIGNAL
        </div>
        <span className="hero-signal-index">MB / 01</span>
      </div>

      <div className="hero-signal-stage">
        <div className="signal-orbit signal-orbit-one" />
        <div className="signal-orbit signal-orbit-two" />
        <div className="signal-orbit signal-orbit-three" />
        <div className="signal-core">
          <div className="signal-core-glow" />
          <BrainMark size={104} animated />
          <span className="signal-core-value">01</span>
        </div>
        <div className="signal-node signal-node-a" />
        <div className="signal-node signal-node-b" />
        <div className="signal-node signal-node-c" />
        <div className="signal-axis signal-axis-x" />
        <div className="signal-axis signal-axis-y" />
        <span className="signal-coordinate signal-coordinate-top">FOCUS / 72</span>
        <span className="signal-coordinate signal-coordinate-bottom">SYNCED 03:42</span>
      </div>

      <div className="hero-signal-footer">
        <div>
          <span className="hero-signal-footer-label">NEXT DRILL</span>
          <strong>REACTION TIME</strong>
        </div>
        <div className="hero-signal-mini-chart" aria-hidden="true">
          <svg viewBox="0 0 190 42" preserveAspectRatio="none">
            <path d="M0 30 C16 29 16 18 31 21 S45 37 59 25 S72 10 86 17 S98 29 110 20 S127 7 140 14 S156 34 170 18 S180 12 190 4" />
          </svg>
        </div>
        <span className="hero-signal-footer-value">+18%</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t } = useLang();
  const grouped = getGamesByCategory();
  useScrollReveal();

  // 只在第一次访问时跳一下大脑 logo —— 后续直接静态出现
  const heroBrainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const seen = sessionStorage.getItem("mb_hero_played");
    if (!seen) {
      heroBrainRef.current?.classList.add("animate-bounce-in");
      sessionStorage.setItem("mb_hero_played", "1");
    }
  }, []);

  return (
    <div className="site-shell">
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow reveal is-visible">
            <span className="eyebrow-dot" />
            COGNITIVE TRAINING / 01
          </div>
          <h1 className="hero-title reveal is-visible">
            {t.heroTitle}
            <span className="hero-title-accent">{t.heroHighlight}</span>
          </h1>
          <p className="hero-description reveal is-visible">{t.heroDesc}</p>
          <div className="hero-actions reveal is-visible">
            <Link href="/games/reaction-time" className="btn-primary hero-primary-cta">
              <Play size={16} fill="currentColor" strokeWidth={2.6} />
              {t.heroPrimaryCta}
              <ArrowUpRight size={16} strokeWidth={2.4} />
            </Link>
            <Link href="/leaderboard" className="btn-ghost hero-secondary-cta">
              <Trophy size={16} strokeWidth={2.2} />
              {t.viewLeaderboard}
            </Link>
          </div>

          <div className="hero-metrics reveal is-visible">
            <div className="hero-metric">
              <strong>{GAMES.length.toString().padStart(2, "0")}</strong>
              <span>{t.statTests}</span>
            </div>
            <div className="hero-metric">
              <strong>{DIFFICULTY_TIERS.toString().padStart(2, "0")}</strong>
              <span>{t.statDifficulties}</span>
            </div>
            <div className="hero-metric">
              <strong>{SUPPORTED_LANGS.toString().padStart(2, "0")}</strong>
              <span>{t.statLangs}</span>
            </div>
          </div>
        </div>

        <div ref={heroBrainRef} className="hero-visual-wrap reveal is-visible">
          <HeroSignalVisual />
          <div className="hero-visual-note">
            <div className="hero-visual-mark">
              <BrainMark size={26} animated={false} />
            </div>
            <div>
              <span>MINDBENCH PROTOCOL</span>
              <strong>Measure what moves you.</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="signal-ribbon" aria-label="MindBench training categories">
        <div className="signal-ribbon-track">
          <span><Zap size={14} /> REACTION</span>
          <span><Brain size={14} /> MEMORY</span>
          <span><Target size={14} /> PRECISION</span>
          <span><Sparkles size={14} /> CURIOSITY</span>
          <span><Activity size={14} /> PROGRESS</span>
        </div>
      </div>

      <main className="home-content">
        <section className="home-section reveal">
          <div className="section-heading-row">
            <div>
              <span className="section-index">01 / DAILY EDGE</span>
              <h2>Start with your fastest signal.</h2>
              <p>Short drills, clear feedback, a sharper read on yourself.</p>
            </div>
            <Link href="/stats" className="section-link">
              {t.statsTitle}
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="featured-grid">
            <MagneticCard href="/games/reaction-time" className="featured-card featured-card-primary">
              <div className="featured-copy">
                <span className="card-kicker"><span className="card-kicker-dot" /> FASTEST SIGNAL</span>
                <h3>{t.rtTitle}</h3>
                <p>{t.rtDesc}</p>
                <span className="card-action">{t.ctaTakeTest} <ArrowUpRight size={15} /></span>
              </div>
              <div className="featured-visual" aria-hidden="true">
                <div className="timer-dial">
                  <div className="timer-dial-ring" />
                  <Timer size={20} />
                  <strong>30</strong>
                  <span>SEC</span>
                </div>
                <div className="signal-bars">
                  <i /><i /><i /><i /><i /><i /><i />
                </div>
                <span className="featured-visual-label">READY WHEN YOU ARE</span>
              </div>
            </MagneticCard>

            <div className="featured-side-stack">
              <MagneticCard href="/games/visual-memory" className="featured-card featured-card-secondary">
                <div className="secondary-icon"><Gauge size={21} /></div>
                <div>
                  <span className="card-kicker">BUILD RECALL</span>
                  <h3>{t.vmTitle}</h3>
                  <p>{t.vmDesc}</p>
                </div>
                <ChevronRight className="card-chevron" size={19} />
              </MagneticCard>
              <div className="insight-card">
                <div className="insight-icon"><LockKeyhole size={17} /></div>
                <div>
                  <strong>Private by default</strong>
                  <span>Log in only when you want your score saved.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {CATEGORY_ORDER.map((cat) => {
          const games = grouped[cat];
          if (!games || games.length === 0) return null;
          const info = CATEGORY_INFO[cat];
          const ctaKey = categoryCta(cat);
          const CatIcon = CATEGORY_ICONS[cat];
          return (
            <section key={cat} className="home-section game-section reveal">
              <div className="section-heading-row compact">
                <div className="section-heading-with-icon">
                  <div className={`section-icon section-icon-${cat}`}>
                    <CatIcon size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <span className="section-index">{cat === "cognitive" ? "02" : cat === "puzzle" ? "03" : cat === "moba" ? "04" : "05"} / COLLECTION</span>
                    <h2>{t[info.titleKey]}</h2>
                  </div>
                </div>
                <span className="section-count">{games.length.toString().padStart(2, "0")} DRILLS</span>
              </div>
              <div className="game-grid">
                {games.map((game) => {
                  const Icon = GAME_ICONS[game.id];
                  return (
                    <MagneticCard key={game.id} href={`/games/${game.id}`} className="game-card">
                      <div className={`game-icon game-icon-${cat}`}>
                        <Icon size={20} strokeWidth={2.1} />
                      </div>
                      <div className="game-card-body">
                        <h3>{t[game.titleKey]}</h3>
                        <p>{t[game.descKey]}</p>
                      </div>
                      <span className="game-card-action">{t[ctaKey]} <ArrowUpRight size={14} /></span>
                    </MagneticCard>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section className="home-section reveal">
          <div className="section-heading-row compact">
            <div className="section-heading-with-icon">
              <div className="section-icon section-icon-mystery"><MystIcons.Header size={20} /></div>
              <div>
                <span className="section-index">06 / AFTER HOURS</span>
                <h2>Mind, mood, mystery.</h2>
              </div>
            </div>
            <span className="section-count">3 MODES</span>
          </div>

          <div className="mystery-grid">
            <MagneticCard href="/iq-test" className="mystery-card mystery-card-iq">
              <div className="mystery-card-topline"><span>IQ ESTIMATION</span><Brain size={17} /></div>
              <h3>See how you think.</h3>
              <p>Five dimensions. One thoughtful baseline.</p>
              <div className="mystery-spectrum" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
              <span className="card-action">Explore test <ArrowUpRight size={15} /></span>
            </MagneticCard>

            <MagneticCard href="/mbti" className="mystery-card mystery-card-mbti">
              <div className="mystery-card-topline"><span>{t.mbtiTitle}</span><MystIcons.Mbti size={17} /></div>
              <h3>Find your pattern.</h3>
              <p>{t.mbtiDesc}</p>
              <div className="mystery-type-grid" aria-hidden="true"><span>NT</span><span>NF</span><span>SJ</span><span>SP</span></div>
              <span className="card-action">{t.mbtiStart} <ArrowUpRight size={15} /></span>
            </MagneticCard>

            <MagneticCard href="/tarot" className="mystery-card mystery-card-tarot">
              <div className="mystery-art" aria-hidden="true">
                <img src="/resources/card/17star.png" alt="" />
                <img src="/resources/card/18moon.png" alt="" />
              </div>
              <div className="mystery-card-topline"><span>{t.tarotTitle}</span><MystIcons.Tarot size={17} /></div>
              <h3>Make room for wonder.</h3>
              <p>{t.tarotDesc}</p>
              <span className="card-action">{t.tarotStart} <ArrowUpRight size={15} /></span>
            </MagneticCard>
          </div>
        </section>

        <section className="proof-strip reveal">
          <div className="proof-mark">
            <BrainMark size={32} animated={false} />
          </div>
          <div className="proof-copy">
            <span className="section-index">THE MINDBENCH LOOP</span>
            <strong>Play a round. Notice a pattern. Come back sharper.</strong>
          </div>
          <Link href="/leaderboard" className="proof-link">
            <Trophy size={16} /> {t.leaderboard} <ArrowUpRight size={15} />
          </Link>
        </section>

        <div className="bottom-stats reveal">
          <div><strong>{GAMES.length}</strong><span>{t.statTests}</span></div>
          <div><strong>{DIFFICULTY_TIERS}</strong><span>{t.statDifficulties}</span></div>
          <div><strong>{SUPPORTED_LANGS}</strong><span>{t.statLangs}</span></div>
          <div><strong><Clock3 size={22} /></strong><span>Short sessions</span></div>
        </div>
      </main>
    </div>
  );
}
