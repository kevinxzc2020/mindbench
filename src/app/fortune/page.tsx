"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLang } from "@/lib/language-context";
import {
  generateFortune,
  todayStr,
  LEVEL_INFO,
  type Fortune,
} from "@/lib/fortune-data";
import { cn } from "@/lib/utils";

export default function FortunePage() {
  const { t, lang } = useLang();
  const { data: session, status } = useSession();
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [dateLabel, setDateLabel] = useState<string>("");

  // Generate on client only — WAIT for session status to resolve so the userKey
  // is stable. Without this, a logged-in user would first see the anonymous
  // fortune (while session loads) and then "flip" to their personalized one —
  // making it look like the fortune changed within the day.
  useEffect(() => {
    if (status === "loading") return;
    const date = todayStr();
    const userKey = session?.user?.id ?? "anonymous";
    setFortune(generateFortune(date, lang, userKey));
    // Pretty local date
    try {
      const d = new Date();
      const localeMap: Record<string, string> = {
        en: "en-US",
        zh: "zh-CN",
        es: "es-ES",
      };
      setDateLabel(
        d.toLocaleDateString(localeMap[lang] ?? "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })
      );
    } catch {
      setDateLabel(date);
    }
  }, [lang, status, session?.user?.id]);

  if (!fortune) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-500">
        …
      </div>
    );
  }

  const info = LEVEL_INFO[fortune.level];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-5 animate-fade-in">
      {/* Header / date */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-white">
          {t.fortuneTitle}
        </h1>
        <p className="text-sm text-gray-500">{dateLabel}</p>
      </div>

      {/* Big level card */}
      <div
        className={cn(
          "card p-8 text-center space-y-4 border-0",
          "bg-gradient-to-br",
          info.gradient
        )}
      >
        <div className="text-7xl">{info.emoji}</div>
        <div>
          <p className="text-5xl font-black text-white tracking-wider drop-shadow-lg">
            {info.name[lang]}
          </p>
          <p className="mt-3 text-2xl tracking-[0.25em]">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={i < info.stars ? "text-white" : "text-white/20"}>
                ★
              </span>
            ))}
          </p>
        </div>
        <p className="text-white/90 leading-relaxed max-w-md mx-auto text-base italic">
          {fortune.overall}
        </p>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CategoryCard emoji="💼" label={t.fortuneCareer} text={fortune.career} accent="text-blue-400" />
        <CategoryCard emoji="💕" label={t.fortuneLove} text={fortune.love} accent="text-pink-400" />
        <CategoryCard emoji="💰" label={t.fortuneWealth} text={fortune.wealth} accent="text-amber-400" />
        <CategoryCard emoji="💚" label={t.fortuneHealth} text={fortune.health} accent="text-emerald-400" />
      </div>

      {/* Lucky color / number */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-5 text-center space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
            {t.fortuneLuckyColor}
          </p>
          <p className="text-xl font-bold text-white">{fortune.luckyColor}</p>
        </div>
        <div className="card p-5 text-center space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
            {t.fortuneLuckyNumber}
          </p>
          <p className="text-xl font-bold text-white tabular-nums">
            {fortune.luckyNumber}
          </p>
        </div>
      </div>

      {/* Do / Avoid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card p-5 space-y-3">
          <h3 className="text-sm font-bold text-green-400 uppercase tracking-wide">
            ✓ {t.fortuneDoToday}
          </h3>
          <ul className="space-y-2">
            {fortune.doItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed"
              >
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5 space-y-3">
          <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wide">
            ✗ {t.fortuneAvoidToday}
          </h3>
          <ul className="space-y-2">
            {fortune.avoidItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed"
              >
                <span className="text-rose-500 mt-0.5 flex-shrink-0">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center text-xs text-gray-500 pt-2 space-y-1">
        <p>🕛 {t.fortuneCheckTomorrow}</p>
        <p className="opacity-60">
          {session?.user?.id ? t.fortunePersonalized : t.fortuneShared}
        </p>
      </div>

      <div className="pt-2 text-center">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← {t.home}
        </Link>
      </div>
    </div>
  );
}

function CategoryCard({
  emoji,
  label,
  text,
  accent,
}: {
  emoji: string;
  label: string;
  text: string;
  accent: string;
}) {
  return (
    <div className="card p-5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <span className={cn("text-xs uppercase tracking-wider font-bold", accent)}>
          {label}
        </span>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
    </div>
  );
}
