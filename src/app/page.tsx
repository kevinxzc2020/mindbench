"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Zap, Brain } from "lucide-react";
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

const CATEGORY_ORDER: GameCategory[] = ["cognitive", "moba", "casual"];
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
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
      {/* ═══════════ Hero ═══════════ */}
      <div className="text-center mb-20">
        <div ref={heroBrainRef} className="inline-flex mb-7 text-brand-400">
          <BrainMark size={92} />
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
          {t.heroTitle}{" "}
          <span className="hero-gradient-text">{t.heroHighlight}</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.heroDesc}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link
            href="/games/reaction-time"
            className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-brand-900/40 inline-flex items-center gap-2"
          >
            <Zap size={18} strokeWidth={2.5} />
            {t.heroPrimaryCta}
          </Link>
          <Link
            href="/leaderboard"
            className="btn-ghost text-sm px-5 py-3 inline-flex items-center gap-2"
          >
            <span className="live-dot" aria-hidden="true" />
            {t.viewLeaderboard}
          </Link>
        </div>
      </div>

      {/* ═══════════ 游戏分类 ═══════════ */}
      {CATEGORY_ORDER.map((cat) => {
        const games = grouped[cat];
        if (!games || games.length === 0) return null;
        const info = CATEGORY_INFO[cat];
        const ctaKey = categoryCta(cat);
        const CatIcon = CATEGORY_ICONS[cat];
        return (
          <section key={cat} className="mb-14 reveal">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center text-white shadow-lg`}
              >
                <CatIcon size={20} strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-extrabold text-white">
                  {t[info.titleKey]}
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">
                  {games.length} {games.length === 1 ? "game" : "games"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {games.map((game) => {
                const Icon = GAME_ICONS[game.id];
                return (
                  <MagneticCard
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="card p-5 hover:border-white/20"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-white mb-3 shadow-lg`}
                    >
                      <Icon size={22} strokeWidth={2.2} />
                    </div>
                    <h3 className="font-bold text-base text-white mb-1.5 leading-tight">
                      {t[game.titleKey]}
                    </h3>
                    <p className="text-xs text-gray-300 leading-snug min-h-[2.5em]">
                      {t[game.descKey]}
                    </p>
                    <div className="mt-3 text-xs text-brand-400 font-semibold flex items-center gap-1">
                      {t[ctaKey]}
                      <span className="inline-block transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </MagneticCard>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* ═══════════ 性格 & 玄学 ═══════════ */}
      <section className="mb-14 reveal">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white shadow-lg">
            <MystIcons.Header size={20} strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-extrabold text-white">性格 & 玄学</h2>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">
              2 items
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MagneticCard href="/iq-test" className="card p-5 hover:border-white/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-700 flex items-center justify-center text-white mb-3 shadow-lg">
              <Brain size={22} strokeWidth={2.2} />
            </div>
            <h3 className="font-bold text-base text-white mb-1.5 leading-tight">IQ Estimation</h3>
            <p className="text-xs text-gray-300 leading-snug">5-dimension cognitive test · numerical, verbal, logical, pattern & abstract</p>
          </MagneticCard>
          <MagneticCard href="/mbti" className="card p-5 hover:border-white/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white mb-3 shadow-lg">
              <MystIcons.Mbti size={22} strokeWidth={2.2} />
            </div>
            <h3 className="font-bold text-base text-white mb-1.5 leading-tight">
              {t.mbtiTitle}
            </h3>
            <p className="text-xs text-gray-300 leading-snug">{t.mbtiDesc}</p>
          </MagneticCard>
          <MagneticCard href="/tarot" className="card p-5 hover:border-white/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 flex items-center justify-center text-white mb-3 shadow-lg">
              <MystIcons.Tarot size={22} strokeWidth={2.2} />
            </div>
            <h3 className="font-bold text-base text-white mb-1.5 leading-tight">
              {t.tarotTitle}
            </h3>
            <p className="text-xs text-gray-300 leading-snug">{t.tarotDesc}</p>
          </MagneticCard>
        </div>
      </section>

      {/* ═══════════ 真实数字 stats ═══════════ */}
      <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 text-center reveal">
        <div className="card p-5 sm:p-6">
          <div className="text-3xl sm:text-4xl font-extrabold text-brand-400 mb-1 tabular-nums">
            {GAMES.length}
          </div>
          <div className="text-xs sm:text-sm text-gray-400">{t.statTests}</div>
        </div>
        <div className="card p-5 sm:p-6">
          <div className="text-3xl sm:text-4xl font-extrabold text-purple-400 mb-1 tabular-nums">
            {DIFFICULTY_TIERS}
          </div>
          <div className="text-xs sm:text-sm text-gray-400">
            {t.statDifficulties}
          </div>
        </div>
        <div className="card p-5 sm:p-6">
          <div className="text-3xl sm:text-4xl font-extrabold text-pink-400 mb-1 tabular-nums">
            {SUPPORTED_LANGS}
          </div>
          <div className="text-xs sm:text-sm text-gray-400">{t.statLangs}</div>
        </div>
      </div>
    </div>
  );
}
