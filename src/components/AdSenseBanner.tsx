"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { getAdSenseConfig, isLocalAdPreview } from "@/lib/adsense";
import { useLang } from "@/lib/language-context";

declare global {
  interface Window {
    adsbygoogle?: { push: (request: Record<string, unknown>) => unknown };
  }
}

const COPY = {
  en: {
    label: "Advertisement", preview: "LAYOUT PREVIEW",
    title: "Homepage banner placement",
    description: "A responsive ad above the game catalogue.",
    format: "RESPONSIVE DISPLAY", note: "Preview only · No live ads",
  },
  zh: {
    label: "广告", preview: "广告位预览",
    title: "首页顶部广告位",
    description: "自适应横幅，位于游戏列表上方。",
    format: "自适应展示广告", note: "仅样板预览 · 未投放真实广告",
  },
  es: {
    label: "Publicidad", preview: "VISTA PREVIA",
    title: "Banner de la página principal",
    description: "Un anuncio adaptable sobre el catálogo de juegos.",
    format: "ANUNCIO ADAPTABLE", note: "Solo vista previa · Sin anuncios reales",
  },
};

/** One top-of-page placement, separate from game filters and gameplay controls. */
export function AdSenseBanner() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const config = getAdSenseConfig();

  if (config.mode === "preview") {
    return (
      <aside className="ad-placement ad-preview" aria-label={copy.preview}>
        <div className="ad-placement-heading">
          <span>{copy.label}</span>
          <span className="ad-preview-badge"><i aria-hidden="true" />{copy.preview}</span>
        </div>
        <div className="ad-preview-canvas">
          <div className="ad-preview-symbol" aria-hidden="true"><span>AD</span></div>
          <div className="ad-preview-copy">
            <p className="ad-preview-title">{copy.title}</p>
            <p className="ad-preview-description">{copy.description}</p>
          </div>
          <span className="ad-preview-format">{copy.format}</span>
        </div>
        <p className="ad-preview-note">{copy.note}</p>
      </aside>
    );
  }

  if (config.mode !== "live" || !config.clientId || !config.homeSlotId) return null;

  return <LiveBanner clientId={config.clientId} slotId={config.homeSlotId} label={copy.label} />;
}

function LiveBanner({ clientId, slotId, label }: { clientId: string; slotId: string; label: string }) {
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
    <aside ref={placementRef} className="ad-placement ad-live" aria-label={label}>
      <div className="ad-placement-heading"><span>{label}</span></div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="horizontal"
        data-full-width-responsive="false"
      />
      {visible && (
        <Script
          id="mindbench-adsense"
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
