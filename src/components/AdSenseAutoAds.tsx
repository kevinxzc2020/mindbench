"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ADSENSE_SCRIPT_ID, autoAdsEnabled, getAdSenseConfig, isAutoAdsRoute, isLocalAdPreview } from "@/lib/adsense";
import { usePrivacy } from "./PrivacyPreferences";

const hasAdScript = () => Boolean(document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'));

/**
 * Loads the AdSense script page-wide so Auto ads (vignette / side rail, enabled in the
 * AdSense dashboard) can run — only after advertising consent and only on allowlisted routes.
 * Google renders and controls those overlays; we never wrap AdSense in our own pop-up.
 */
export function AdSenseAutoAds() {
  const { consent, ready } = usePrivacy();
  const pathname = usePathname() ?? "/";
  const config = getAdSenseConfig();
  const [eligible, setEligible] = useState(false);
  const firstPath = useRef<string | null>(null);

  useEffect(() => {
    setEligible(!isLocalAdPreview(window.location.hostname));
  }, []);

  // The script cannot be unloaded after client-side navigation. When the visitor moves from a
  // page that loaded it into a page that must stay ad-overlay free (a device check or game),
  // do one full load of that page so no side rail or vignette carries over.
  useEffect(() => {
    if (firstPath.current === null) { firstPath.current = pathname; return; }
    if (!autoAdsEnabled() || isAutoAdsRoute(pathname) || !hasAdScript()) return;
    window.location.reload();
  }, [pathname]);

  const allowed = autoAdsEnabled()
    && config.mode === "live"
    && Boolean(config.clientId)
    && eligible
    && ready
    && consent.advertising
    && isAutoAdsRoute(pathname);

  if (!allowed || !config.clientId) return null;

  return (
    <Script
      id={ADSENSE_SCRIPT_ID}
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.clientId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
