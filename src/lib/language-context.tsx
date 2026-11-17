"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { translations, type Lang, type Translations } from "./translations";
import { localizePath, rememberLang, stripLangPrefix } from "./i18n";

interface LanguageContextValue {
  lang: Lang;
  /** Remember the choice and open the current page in that language (its own `/zh` or `/es` URL). */
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

/**
 * The language comes from the URL (`/zh/...`), so the server renders each page in its own language
 * and `<html lang>` is correct before any script runs. The provider only mirrors it to client code.
 */
export function LanguageProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const router = useRouter();
  const setLang = useCallback((next: Lang) => {
    rememberLang(next);
    if (next === lang) return;
    const { pathname, search, hash } = window.location;
    router.push(localizePath(next, `${pathname}${search}${hash}`));
  }, [lang, router]);
  const value = useMemo(() => ({ lang, setLang, t: translations[lang] }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}

/**
 * The current path without its language prefix. A statically generated English page is rendered
 * as `/en/...` on the server but shown at `/...`, so raw `usePathname()` output must never reach
 * the markup directly; this is the same value on the server and in the browser.
 */
export function useBarePathname() {
  return stripLangPrefix(usePathname() ?? "/");
}

/** `localize("/tools/mouse")` → the same page in the current language. */
export function useLocalizeHref() {
  const { lang } = useLang();
  return useCallback((href: string) => localizePath(lang, href), [lang]);
}
