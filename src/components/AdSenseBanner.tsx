"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { ADSENSE_SCRIPT_ID, getAdSenseConfig, isLocalAdPreview, type AdFormat, type AdPlacement } from "@/lib/adsense";
import { useLang } from "@/lib/language-context";
import { usePrivacy } from "./PrivacyPreferences";

declare global {
  interface Window {
    adsbygoogle?: { push: (request: Record<string, unknown>) => unknown };
  }
}

const COPY = {
  en: {
    label: "Advertisement", preview: "LAYOUT PREVIEW",
    title: "Homepage banner placement",
    description: "A responsive ad above the collections.",
    format: "RESPONSIVE DISPLAY", note: "Preview only · No live ads",
  },
  zh: {
    label: "广告", preview: "广告位预览",
    title: "首页顶部广告位",
    description: "自适应横幅，位于合集目录上方。",
    format: "自适应展示广告", note: "仅样板预览 · 未投放真实广告",
  },
  es: {
    label: "Publicidad", preview: "VISTA PREVIA",
    title: "Banner de la página principal",
    description: "Un anuncio adaptable sobre las colecciones.",
    format: "ANUNCIO ADAPTABLE", note: "Solo vista previa · Sin anuncios reales",
  },
};

/** One top-of-page placement, separate from game filters and gameplay controls. */
const PLACEMENT_TITLES: Record<AdPlacement, [string, string, string]> = {
  top: ["Top banner placement", "顶部横幅广告位", "Banner superior"],
  home: ["Homepage banner placement", "首页顶部广告位", "Banner de la página principal"],
  "home-mid": ["Homepage mid-page placement", "首页中部广告位", "Anuncio a mitad de página"],
  "home-bottom": ["Homepage bottom placement", "首页底部广告位", "Anuncio al final de la página"],
  result: ["After-check advertisement", "检测完成后广告位", "Publicidad tras la revisión"],
  tool: ["Below-the-tool placement", "工具下方广告位", "Anuncio bajo la herramienta"],
  collection: ["Collection page placement", "合集页广告位", "Anuncio en la colección"],
  content: ["In-content placement", "内容页广告位", "Anuncio en el contenido"],
};

export function AdSenseBanner({ placement = "home", format = "auto" }: { placement?: AdPlacement; format?: AdFormat }) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const config = getAdSenseConfig();
  const { consent, ready } = usePrivacy();
  const slot = placement === "result" ? config.resultSlotId : placement === "home" ? config.homeSlotId : config.displaySlotId;
  const placementTitle = PLACEMENT_TITLES[placement][lang === "zh" ? 1 : lang === "es" ? 2 : 0];

  if (config.mode === "preview") {
    return (
      <aside className={`ad-placement ad-preview ad-format-${format}`} aria-label={copy.preview}>
        <div className="ad-placement-heading">
          <span>{copy.label}</span>
          <span className="ad-preview-badge"><i aria-hidden="true" />{copy.preview}</span>
        </div>
        <div className="ad-preview-canvas">
          <div className="ad-preview-symbol" aria-hidden="true"><span>AD</span></div>
          <div className="ad-preview-copy">
            <p className="ad-preview-title">{placementTitle}</p>
            {placement === "home" && <p className="ad-preview-description">{copy.description}</p>}
          </div>
          <span className="ad-preview-format">{copy.format}</span>
        </div>
        <p className="ad-preview-note">{copy.note}</p>
      </aside>
    );
  }

  if (config.mode !== "live" || !config.clientId || !slot || !ready || !consent.advertising) return null;

  return <LiveBanner key={`${placement}-${slot}`} clientId={config.clientId} slotId={slot} label={copy.label} format={format} />;
}

function LiveBanner({ clientId, slotId, label, format }: { clientId: string; slotId: string; label: string; format: AdFormat }) {
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
    <aside ref={placementRef} className={`ad-placement ad-live ad-format-${format}`} aria-label={label}>
      <div className="ad-placement-heading"><span>{label}</span></div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={format === "rectangle" ? "false" : "true"}
      />
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
