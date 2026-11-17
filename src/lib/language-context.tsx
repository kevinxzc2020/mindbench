"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Lang, type Translations } from "./translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  }, [lang]);

  // Persist language choice
  useEffect(() => {
    let stored: Lang | null = null;
    try { stored = localStorage.getItem("mb-lang") as Lang | null; } catch { /* storage blocked: fall back to the browser language */ }
    if (stored && stored in translations) { setLangState(stored); return; }
    // First visit: follow the browser's language instead of always opening in English.
    const preferred = (navigator.languages?.[0] ?? navigator.language ?? "en").toLowerCase();
    if (preferred.startsWith("zh")) setLangState("zh");
    else if (preferred.startsWith("es")) setLangState("es");
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("mb-lang", l); } catch { /* the choice lasts for this visit only */ }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
