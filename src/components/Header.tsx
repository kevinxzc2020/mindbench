"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import type { Lang } from "@/lib/translations";

const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "zh", label: "中" },
];

export function Header() {
  const { data: session } = useSession();
  const { t, lang, setLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-2xl">🧠</span>
          <span className="text-white">Mind<span className="text-brand-400">Bench</span></span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="btn-ghost text-sm">{t.home}</Link>
          <Link href="/leaderboard" className="btn-ghost text-sm">{t.leaderboard}</Link>
          {session && (
            <>
              <Link href="/stats" className="btn-ghost text-sm">{t.statsTitle}</Link>
              <Link href="/profile" className="btn-ghost text-sm">{t.myRecords}</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg p-0.5">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                  lang === code
                    ? "bg-brand-600 text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Auth */}
          {session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 btn-ghost text-sm"
              >
                <span className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                </span>
                <span className="hidden md:block">{session.user?.name}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 card shadow-xl py-1">
                  <Link
                    href="/stats"
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    📊 {t.statsTitle}
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t.myRecords}
                  </Link>
                  <button
                    onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors"
                  >
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">{t.login}</Link>
              <Link href="/register" className="btn-primary text-sm">{t.register}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
