"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { ADSENSE_SCRIPT_ID, AD_SIZES, adSizeFor, getAdSenseConfig, isLocalAdPreview, type AdPlacement, type AdSize } from "@/lib/adsense";
import { useLang } from "@/lib/language-context";
import { usePrivacy } from "./PrivacyPreferences";

declare global {
  interface Window {
    adsbygoogle?: { push: (request: Record<string, unknown>) => unknown };
  }
}

const COPY = {
  en: { label: "Advertisement", preview: "LAYOUT PREVIEW", note: "Preview only · No live ads" },
  zh: { label: "广告", preview: "广告位预览", note: "仅样板预览 · 未投放真实广告" },
  es: { label: "Publicidad", preview: "VISTA PREVIA", note: "Solo vista previa · Sin anuncios reales" },
};

const PLACEMENT_TITLES: Record<AdPlacement, [string, string, string]> = {
  rail: ["Side rail", "侧边广告", "Lateral"],
  top: ["Top banner", "顶部横幅", "Banner superior"],
  home: ["Homepage", "首页", "Página principal"],
  "home-mid": ["Homepage · middle", "首页中部", "Mitad de página"],
  "home-bottom": ["Homepage · bottom", "首页底部", "Final de la página"],
  result: ["After the check", "检测完成后", "Tras la revisión"],
  tool: ["Below the tool", "工具下方", "Bajo la herramienta"],
  collection: ["Collection page", "合集页", "Colección"],
  content: ["In content", "内容页", "En el contenido"],
};

/**
 * One manual AdSense unit. Each placement uses fixed standard Google sizes per screen width
 * (see AD_SIZES): the box is exactly the ad's size, so nothing jumps when the ad loads.
 */
export function AdSenseBanner({ placement = "home" }: { placement?: AdPlacement }) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const config = getAdSenseConfig();
  const { consent, ready } = usePrivacy();
  const slot = placement === "result" ? config.resultSlotId : placement === "home" ? config.homeSlotId : config.displaySlotId;
  const size = adSizeFor(placement);
  const title = PLACEMENT_TITLES[placement][lang === "zh" ? 1 : lang === "es" ? 2 : 0];

  if (config.mode === "preview") {
    return (
      <aside className={`ad-placement ad-preview ad-size-${size}`} aria-label={copy.preview}>
        <div className="ad-placement-heading">
          <span>{copy.label}</span>
          <span className="ad-preview-badge"><i aria-hidden="true" />{copy.preview}</span>
        </div>
        <div className={`ad-unit ad-unit-${size} ad-preview-box`}>
          <strong>{title}</strong>
          {/* Every breakpoint's Google size is listed; CSS shows the one in use. */}
          {AD_SIZES[size].map(([min, width, height]) => <span key={min} className={`ad-dim ad-dim-${min}`}>{width} × {height}</span>)}
        </div>
        <p className="ad-preview-note">{copy.note}</p>
      </aside>
    );
  }

  if (config.mode !== "live" || !config.clientId || !slot || !ready || !consent.advertising) return null;

  return <LiveBanner key={`${placement}-${slot}`} clientId={config.clientId} slotId={slot} label={copy.label} size={size} />;
}

function LiveBanner({ clientId, slotId, label, size }: { clientId: string; slotId: string; label: string; size: AdSize }) {
  const placementRef = useRef<HTMLElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const requestedRef = useRef(false);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setEligible(!isLocalAdPreview(window.location.hostname));
  }, []);

  useEffect(() => {
    if (!eligible || !placementRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.boundingClientRect.width > 0)) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(placementRef.current);
    return () => observer.disconnect();
  }, [eligible]);

  function requestAd() {
    const element = adRef.current;
    if (!element || requestedRef.current || element.hasAttribute("data-adsbygoogle-status")) return;
    // A hidden slot (e.g. a side rail on a narrow screen) must never request an ad.
    if (element.getBoundingClientRect().width === 0) return;
    requestedRef.current = true;
    try {
      const queue = window.adsbygoogle ?? ([] as Record<string, unknown>[]);
      window.adsbygoogle = queue;
      queue.push({});
    } catch {
      setFailed(true);
    }
  }

  if (!eligible || failed) return null;

  return (
    <aside ref={placementRef} className={`ad-placement ad-live ad-size-${size}`} aria-label={label}>
      <div className="ad-placement-heading"><span>{label}</span></div>
      {/* Fixed-size unit: no data-ad-format, so AdSense fills exactly the CSS width × height. */}
      <ins ref={adRef} className={`adsbygoogle ad-unit ad-unit-${size}`} data-ad-client={clientId} data-ad-slot={slotId} />
      {visible && (
        <Script
          id={ADSENSE_SCRIPT_ID}
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
          onReady={requestAd}
          onError={() => setFailed(true)}
        />
      )}
    </aside>
  );
}
