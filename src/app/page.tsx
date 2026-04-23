"use client";

import Link from "next/link";
import { GAMES } from "@/lib/utils";
import { useLang } from "@/lib/language-context";

export default function HomePage() {
  const { t } = useLang();

  const stats = [
    { label: t.statTests, value: "4+" },
    { label: t.statPlayers, value: "∞" },
    { label: t.statFree, value: "✓" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-20">
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

      {/* Game Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {GAMES.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className="card p-6 hover:border-gray-600 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-brand-900/20 group"
          >
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}
            >
              {game.icon}
            </div>
            <h2 className="font-bold text-lg text-white mb-1 group-hover:text-brand-300 transition-colors">
              {t[game.titleKey]}
            </h2>
            <p className="text-sm text-gray-400">{t[game.descKey]}</p>
            <div className="mt-4 text-xs text-brand-400 font-semibold flex items-center gap-1">
              {t.startTest} <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats teaser */}
      <div className="mt-20 grid grid-cols-3 gap-8 text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="text-3xl font-extrabold text-brand-400 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
