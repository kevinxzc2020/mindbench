"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLang } from "@/lib/language-context";
import { getAnalyticsId, setAnalyticsSender } from "@/lib/analytics";
import { autoAdsEnabled, getAdSenseConfig, isLocalAdPreview } from "@/lib/adsense";
import { CONSENT_KEY, NO_CONSENT, parseConsent, type SiteConsent } from "@/lib/site-consent";
import styles from "./PrivacyPreferences.module.css";

const Privacy = createContext({ consent: NO_CONSENT, ready: false, open: () => {} });
export const usePrivacy = () => useContext(Privacy);

const COPY = {
  en: { title: "Your privacy choices", text: "Choose whether to allow Google Analytics usage statistics and Google advertising. The tools work with both turned off. Test inputs, recordings and your notes are not sent to Analytics.", analytics: "Usage statistics (Google Analytics)", ads: "Advertising (Google AdSense)", save: "Save choices", reject: "Reject optional", accept: "Accept both", link: "Privacy policy", settings: "Privacy settings", reload: "Withdrawing a previously enabled service reloads this page to stop its scripts. Finish any unsaved check first." },
  zh: { title: "你的隐私选择", text: "选择是否允许 Google Analytics 使用统计和 Google 广告。关闭两项也能使用工具；检测输入、录音和备注不会发送给 Analytics。", analytics: "使用统计（Google Analytics）", ads: "广告（Google AdSense）", save: "保存选择", reject: "拒绝非必要项", accept: "允许两项", link: "隐私政策", settings: "隐私设置", reload: "撤回已开启的服务会刷新页面，以停止其脚本。请先保存尚未完成的检测。" },
  es: { title: "Tus opciones de privacidad", text: "Elige si permites estadísticas de Google Analytics y publicidad de Google. Las herramientas funcionan con ambas desactivadas. Las entradas, grabaciones y notas de las pruebas no se envían a Analytics.", analytics: "Estadísticas (Google Analytics)", ads: "Publicidad (Google AdSense)", save: "Guardar opciones", reject: "Rechazar opcionales", accept: "Aceptar ambas", link: "Privacidad", settings: "Opciones de privacidad", reload: "Retirar un servicio activo recarga esta página para detener sus scripts. Guarda primero tu revisión." },
};

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const { lang } = useLang(); const c = COPY[lang];
  const [consent, setConsent] = useState<SiteConsent>(NO_CONSENT), [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false), [draft, setDraft] = useState(NO_CONSENT);
  const previous = useRef<SiteConsent>(NO_CONSENT);
  const panel = useRef<HTMLElement>(null), opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const read = () => { try { return parseConsent(localStorage.getItem(CONSENT_KEY)); } catch { return null; } };
    const saved = read(); previous.current = saved ?? NO_CONSENT; setConsent(previous.current); setDraft(previous.current); setReady(true);
    const ads = getAdSenseConfig();
    const configured = getAnalyticsId() || (ads.mode === "live" && (ads.homeSlotId || ads.resultSlotId || (ads.clientId && autoAdsEnabled())));
    setVisible(Boolean(configured && !saved && !isLocalAdPreview(location.hostname)));
    const sync = (event: StorageEvent) => {
      if (event.key !== CONSENT_KEY && event.key !== null) return;
      const next = read() ?? NO_CONSENT;
      if ((previous.current.analytics && !next.analytics) || (previous.current.advertising && !next.advertising)) {
        setAnalyticsSender(null); window.location.reload(); return;
      }
      previous.current = next; setConsent(next); setDraft(next);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const open = useCallback(() => { opener.current = document.activeElement as HTMLElement; setDraft(previous.current); setVisible(true); }, []);
  useEffect(() => { if (visible && opener.current) panel.current?.focus(); }, [visible]);
  const save = (next: SiteConsent) => {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(next)); } catch { /* Choices still apply to this page; reload defaults to no consent. */ }
    const revoke = (consent.analytics && !next.analytics) || (consent.advertising && !next.advertising);
    if (revoke) setAnalyticsSender(null);
    previous.current = next; setConsent(next); setDraft(next); setVisible(false); opener.current?.focus();
    if (revoke) window.location.reload();
  };
  return <Privacy.Provider value={{ consent, ready, open }}>{children}{visible && <section ref={panel} tabIndex={-1} className={styles.panel} role="region" aria-labelledby="privacy-choices-title">
    <h2 id="privacy-choices-title">{c.title}</h2><p>{c.text} <Link href="/privacy">{c.link}</Link></p>
    <div className={styles.choices}><label><input type="checkbox" checked={draft.analytics} onChange={e => setDraft({ ...draft, analytics: e.target.checked })}/>{c.analytics}</label><label><input type="checkbox" checked={draft.advertising} onChange={e => setDraft({ ...draft, advertising: e.target.checked })}/>{c.ads}</label></div>
    {(consent.analytics || consent.advertising) && <p>{c.reload}</p>}
    <div className={styles.actions}><button onClick={() => save(NO_CONSENT)}>{c.reject}</button><button onClick={() => save(draft)}>{c.save}</button><button onClick={() => save({ version: 1, analytics: true, advertising: true })}>{c.accept}</button></div>
  </section>}</Privacy.Provider>;
}

export function PrivacySettingsButton() {
  const { open } = usePrivacy(); const { lang } = useLang();
  return <button type="button" className={styles.settings} onClick={open}>{COPY[lang].settings}</button>;
}
