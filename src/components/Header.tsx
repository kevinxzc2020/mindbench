"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { BarChart3, ChevronDown, Globe2, Menu, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import type { Lang } from "@/lib/translations";

const LANGS: { code: Lang; label: string; aria: string }[] = [
  { code: "en", label: "EN", aria: "English" },
  { code: "es", label: "ES", aria: "Español" },
  { code: "zh", label: "中", aria: "中文" },
];

export function Header() {
  const { data: session } = useSession();
  const { t, lang, setLang } = useLang();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const navItems = [
    { href: "/", label: t.home, icon: null },
    { href: "/leaderboard", label: t.leaderboard, icon: Trophy },
    ...(session ? [{ href: "/stats", label: t.statsTitle, icon: BarChart3 }] : []),
  ];

  function closeMenus() {
    setMenuOpen(false);
    setAccountOpen(false);
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link
          href="/"
          className="brand-lockup"
          aria-label="MindBench home"
          onClick={closeMenus}
        >
          <Image src="/brand/mindbench-wordmark-v2.png" width={240} height={80} priority alt="MindBench" className="brand-logo" />
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn("nav-link", active && "nav-link-active")}
                aria-current={active ? "page" : undefined}
              >
                {Icon && <Icon size={15} strokeWidth={2.2} />}
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <div className="language-switcher" role="radiogroup" aria-label="Language">
            <Globe2 size={14} className="language-globe" aria-hidden="true" />
            {LANGS.map(({ code, label, aria }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                role="radio"
                aria-checked={lang === code}
                aria-label={`Switch to ${aria}`}
                className={cn("language-button", lang === code && "language-button-active")}
              >
                {label}
              </button>
            ))}
          </div>

          {session ? (
            <div className="account-wrap">
              <button
                onClick={() => setAccountOpen((open) => !open)}
                className="account-button"
                aria-expanded={accountOpen}
              >
                <span className="account-avatar">
                  {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                </span>
                <span className="account-name">{session.user?.name}</span>
                <ChevronDown size={14} />
              </button>
              {accountOpen && (
                <div className="account-menu">
                  <Link href="/stats" onClick={closeMenus}>{t.statsTitle}</Link>
                  <Link href="/profile" onClick={closeMenus}>{t.myRecords}</Link>
                  <button onClick={() => { signOut({ callbackUrl: "/" }); closeMenus(); }}>
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-actions">
              <Link href="/login" className="nav-link auth-login">{t.login}</Link>
              <Link href="/register" className="header-signup">{t.register}</Link>
            </div>
          )}

          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMenus}
                className={cn("mobile-nav-link", active && "mobile-nav-link-active")}
              >
                {Icon && <Icon size={17} />}
                {label}
              </Link>
            );
          })}
          {session && (
            <Link href="/profile" onClick={closeMenus} className="mobile-nav-link">
              {t.myRecords}
            </Link>
          )}
          {!session && (
            <>
              <Link href="/login" onClick={closeMenus} className="mobile-nav-link">{t.login}</Link>
              <Link href="/register" onClick={closeMenus} className="mobile-nav-link">{t.register}</Link>
            </>
          )}
          {session && <button onClick={() => { signOut({ callbackUrl: "/" }); closeMenus(); }} className="mobile-nav-link">{t.logout}</button>}
        </nav>
      )}
    </header>
  );
}
