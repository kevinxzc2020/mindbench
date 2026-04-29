"use client";

import Link from "next/link";
import { GAMES, getGamesByCategory, CATEGORY_INFO, type GameCategory } from "@/lib/utils";
import { useLang } from "@/lib/language-context";

// Order of category sections on the home page
const CATEGORY_ORDER: GameCategory[] = ["cognitive", "moba", "casual"];

export default function HomePage() {
  const { t } = useLang();

  const stats = [
    { label: t.statTests, value: `${GAMES.length}+` },
    { label: t.statPlayers, value: "∞" },
    { label: t.statFree, value: "✓" },
  ];

  const grouped = getGamesByCategory();

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="text-6xl mb-6 animate-bounce-in">🧠</div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          {t.heroTitle}{" "}
          <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
            {t.heroHighlight}
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          {t.heroDesc}
        </p>
        <Link href="/leaderboard" className="btn-primary text-base px-8 py-3">
          {t.viewLeaderboard}
        </Link>
      </div>

      {/* Game sections by category */}
      {CATEGORY_ORDER.map((cat) => {
        const games = grouped[cat];
        if (!games || games.length === 0) return null;
        const info = CATEGORY_INFO[cat];
        return (
          <section key={cat} className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center text-xl shadow`}
              >
                {info.emoji}
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                {t[info.titleKey]}
              </h2>
              <span className="text-xs text-gray-500 ml-1">
                {games.length} {games.length === 1 ? "game" : "games"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {games.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="card p-5 hover:border-gray-600 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-brand-900/20 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-xl mb-3 shadow-lg`}
                  >
                    {game.icon}
                  </div>
                  <h3 className="font-bold text-base text-white mb-1 group-hover:text-brand-300 transition-colors">
                    {t[game.titleKey]}
                  </h3>
                  <p className="text-xs text-gray-400 leading-snug">{t[game.descKey]}</p>
                  <div className="mt-3 text-xs text-brand-400 font-semibold flex items-center gap-1">
                    {t.startTest}{" "}
                    <span className="group-hover:translate-x-1 transition-transform inline-block">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* 性格 & 玄学 (Mystic) section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xl shadow">
            🔮
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {/* Reuse mbti title category-ish */}
            性格 & 玄学
          </h2>
          <span className="text-xs text-gray-500 ml-1">3 items</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/mbti"
            className="card p-5 hover:border-gray-600 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-900/20 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xl mb-3 shadow-lg">
              🧬
            </div>
            <h3 className="font-bold text-base text-white mb-1 group-hover:text-purple-300 transition-colors">
              {t.mbtiTitle}
            </h3>
            <p className="text-xs text-gray-400">{t.mbtiDesc}</p>
          </Link>
          <Link
            href="/tarot"
            className="card p-5 hover:border-gray-600 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-900/20 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 flex items-center justify-center text-xl mb-3 shadow-lg">
              🔮
            </div>
            <h3 className="font-bold text-base text-white mb-1 group-hover:text-indigo-300 transition-colors">
              {t.tarotTitle}
            </h3>
            <p className="text-xs text-gray-400">{t.tarotDesc}</p>
          </Link>
          <Link
            href="/fortune"
            className="card p-5 hover:border-gray-600 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-900/20 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-xl mb-3 shadow-lg">
              🍀
            </div>
            <h3 className="font-bold text-base text-white mb-1 group-hover:text-amber-300 transition-colors">
              {t.fortuneTitle}
            </h3>
            <p className="text-xs text-gray-400">{t.fortuneDesc}</p>
          </Link>
        </div>
      </section>

      {/* Stats teaser */}
      <div className="mt-12 grid grid-cols-3 gap-8 text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="text-3xl font-extrabold text-brand-400 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
