"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { BarChart3, ChevronDown, ClipboardList, Globe2, Grid2X2, History, Menu, Search, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import { activeCollection, COLLECTION_NAV } from "@/lib/collection-navigation";
import type { Lang } from "@/lib/translations";

const LANGS: { code: Lang; label: string; aria: string }[] = [
  { code: "en", label: "EN", aria: "English" },
  { code: "es", label: "ES", aria: "Español" },
  { code: "zh", label: "中", aria: "中文" },
];
const COPY = {
  en: { primary: "Main categories", more: "Records & more", progress: "Test progress", reports: "Device checkup history", all: "Tool directory", daily: "Daily challenge", open: "Open menu", close: "Close menu" },
  zh: { primary: "主要分类", more: "记录与更多", progress: "测试进步记录", reports: "设备自检记录", all: "工具目录", daily: "每日挑战", open: "打开菜单", close: "关闭菜单" },
  es: { primary: "Categorías principales", more: "Historial y más", progress: "Progreso en pruebas", reports: "Historial de dispositivos", all: "Directorio de herramientas", daily: "Reto diario", open: "Abrir menú", close: "Cerrar menú" },
};

export function Header() {
  const { data: session } = useSession();
  const { t, lang, setLang } = useLang();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<"mobile" | "account" | "more" | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLButtonElement>(null);
  const c = COPY[lang];
  const active = activeCollection(pathname);
  const navItems = COLLECTION_NAV.map(item => ({ ...item, href: `/collections/${item.id}` }));
  const commonItems = [
    { href: "/progress", label: c.progress, icon: History },
    { href: "/tools/device-reports", label: c.reports, icon: ClipboardList },
    { href: "/leaderboard", label: t.leaderboard, icon: Trophy },
    { href: "/daily", label: c.daily, icon: BarChart3 },
    { href: "/collections", label: c.all, icon: Grid2X2 },
  ];
  function closeMenus() { setOpenMenu(null); }
  function toggle(menu: NonNullable<typeof openMenu>) { setOpenMenu(current => current === menu ? null : menu); }
  useEffect(() => { setOpenMenu(null); }, [pathname]);
  useEffect(() => {
    if (!openMenu) return;
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenMenu(null);
      (openMenu === "more" ? moreRef : openMenu === "mobile" ? mobileRef : accountRef).current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [openMenu]);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="header-inner">
        <Link href="/" className="brand-lockup" aria-label={`MindBench · ${t.home}`} onClick={closeMenus}>
          <Image src="/brand/mindbench-laboratory-logo.png" width={2172} height={724} sizes="(max-width: 600px) 146px, 180px" priority alt="MindBench" className="brand-logo" />
        </Link>
        <nav className="desktop-nav" aria-label={c.primary}>
          {navItems.map(item => <Link key={item.id} href={item.href} onClick={closeMenus} className={cn("nav-link", active === item.id && "nav-link-active")} aria-current={active === item.id ? "page" : undefined}>{item.name[lang]}</Link>)}
        </nav>
        <div className="header-actions"><Link href="/collections#tool-search" className="header-search" aria-label={lang === "zh" ? "搜索工具" : lang === "es" ? "Buscar herramientas" : "Search tools"}><Search size={18}/></Link>
          <div className="header-more">
            <button ref={moreRef} type="button" className="header-more-button" aria-label={c.more} title={c.more} aria-expanded={openMenu === "more"} aria-controls="header-common-links" onClick={() => toggle("more")}><History size={18} /><ChevronDown size={12} /></button>
            {openMenu === "more" && <nav id="header-common-links" className="account-menu header-common-links" aria-label={c.more}>{commonItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={closeMenus} aria-current={pathname === href ? "page" : undefined}><Icon size={16} />{label}</Link>)}</nav>}
          </div>
          <div className="language-switcher" role="radiogroup" aria-label="Language">
            <Globe2 size={14} className="language-globe" aria-hidden="true" />
            {LANGS.map(({ code, label, aria }) => <button key={code} onClick={() => setLang(code)} role="radio" aria-checked={lang === code} aria-label={`Switch to ${aria}`} className={cn("language-button", lang === code && "language-button-active")}>{label}</button>)}
          </div>
          {session ? (
            <div className="account-wrap">
              <button ref={accountRef} onClick={() => toggle("account")} className="account-button" aria-expanded={openMenu === "account"} aria-controls="header-account-links">
                <span className="account-avatar">{session.user?.name?.[0]?.toUpperCase() ?? "U"}</span><span className="account-name">{session.user?.name}</span><ChevronDown size={14} />
              </button>
              {openMenu === "account" && <div id="header-account-links" className="account-menu"><Link href="/stats" onClick={closeMenus}>{t.statsTitle}</Link><Link href="/profile" onClick={closeMenus}>{t.myRecords}</Link><button onClick={() => { signOut({ callbackUrl: "/" }); closeMenus(); }}>{t.logout}</button></div>}
            </div>
          ) : <div className="auth-actions"><Link href="/login" className="nav-link auth-login">{t.login}</Link><Link href="/register" className="header-signup">{t.register}</Link></div>}
          <button ref={mobileRef} className="mobile-menu-button" onClick={() => toggle("mobile")} aria-expanded={openMenu === "mobile"} aria-controls="header-mobile-links" aria-label={openMenu === "mobile" ? c.close : c.open}>{openMenu === "mobile" ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {openMenu === "mobile" && <nav id="header-mobile-links" className="mobile-nav" aria-label={c.primary}>
        <Link href="/" onClick={closeMenus} className="mobile-nav-link" aria-current={pathname === "/" ? "page" : undefined}>{t.home}</Link>
        <div className="mobile-nav-group">{navItems.map(item => <Link key={item.id} href={item.href} onClick={closeMenus} className={cn("mobile-nav-link", active === item.id && "mobile-nav-link-active")} aria-current={active === item.id ? "page" : undefined}>{item.name[lang]}</Link>)}</div>
        <div className="mobile-nav-group">{commonItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={closeMenus} className="mobile-nav-link" aria-current={pathname === href ? "page" : undefined}><Icon size={16} />{label}</Link>)}</div>
        <div className="mobile-nav-group">{session ? <><Link href="/stats" onClick={closeMenus} className="mobile-nav-link">{t.statsTitle}</Link><Link href="/profile" onClick={closeMenus} className="mobile-nav-link">{t.myRecords}</Link><button onClick={() => { signOut({ callbackUrl: "/" }); closeMenus(); }} className="mobile-nav-link">{t.logout}</button></> : <><Link href="/login" onClick={closeMenus} className="mobile-nav-link">{t.login}</Link><Link href="/register" onClick={closeMenus} className="mobile-nav-link">{t.register}</Link></>}</div>
      </nav>}
    </header>
  );
}
