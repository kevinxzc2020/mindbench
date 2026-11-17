"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { isAutoAdsRoute } from "@/lib/adsense";
import { useLang } from "@/lib/language-context";
import { AdSenseBanner } from "./AdSenseBanner";

const CLOSED_KEY = "mb-anchor-closed";
const readClosed = () => { try { return sessionStorage.getItem(CLOSED_KEY) === "1"; } catch { return false; } };

/**
 * Bottom anchor ad: slides up shortly after a page opens, one per page, with a close button.
 * Closing hides it for the rest of the browser session. Same pages as Auto ads (never games),
 * and it is not shown at all when no ad would render (off mode, no consent, unfilled).
 */
export function AdSenseAnchor() {
  const pathname = usePathname() ?? "/";
  const { lang } = useLang();
  const [closed, setClosed] = useState(true);
  const [open, setOpen] = useState(false);
  useEffect(() => { setClosed(readClosed()); }, []);
  useEffect(() => {
    setOpen(false);
    if (closed || !isAutoAdsRoute(pathname)) return;
    const timer = window.setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [pathname, closed]);
  if (closed || !isAutoAdsRoute(pathname)) return null;
  const close = () => { try { sessionStorage.setItem(CLOSED_KEY, "1"); } catch { /* closes for this page view only */ } setClosed(true); };
  return <div className={`ad-anchor${open ? " is-open" : ""}`}>
    <button type="button" className="ad-anchor-close" onClick={close} aria-label={{ en: "Close ad", zh: "关闭广告", es: "Cerrar anuncio" }[lang]}><X size={14} aria-hidden="true"/></button>
    <AdSenseBanner key={pathname} placement="anchor"/>
  </div>;
}
