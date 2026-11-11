"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { analyticsEnabled, analyticsPath, analyticsReferrer, getAnalyticsId, setAnalyticsSender } from "@/lib/analytics";
import { usePrivacy } from "./PrivacyPreferences";

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; }
}

/** Basic consent: no Google Analytics script or event before opt-in. */
export function GoogleAnalytics() {
  const { consent, ready } = usePrivacy(); const pathname = usePathname();
  const id = getAnalyticsId(); const initialized = useRef(false), lastPage = useRef("");
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const allowed = ready && analyticsEnabled(id, consent.analytics, location.hostname);
    if (!id || !allowed) {
      setAnalyticsSender(null); setLoad(false);
      if (id) (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = true;
      return;
    }
    (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = false;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = window.gtag ?? function () { window.dataLayer!.push(arguments); };
    const gtag = window.gtag;
    const page = `${location.origin}${analyticsPath(pathname)}`;
    const referrer = lastPage.current || analyticsReferrer(document.referrer);
    if (!initialized.current) {
      gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      gtag("consent", "update", { analytics_storage: "granted" });
      gtag("js", new Date());
      gtag("config", id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: page, page_referrer: referrer, page_title: "MindBench" });
      initialized.current = true;
    }
    gtag("set", { page_location: page, page_referrer: referrer, page_title: "MindBench" });
    setAnalyticsSender((name, params) => gtag("event", name, { ...params, send_to: id, page_location: `${location.origin}${analyticsPath(location.pathname)}`, page_title: "MindBench", page_referrer: "" }));
    if (lastPage.current !== page) {
      gtag("event", "page_view", { send_to: id, page_location: page, page_title: "MindBench", page_referrer: referrer });
      lastPage.current = page;
      // The diagnostic provider can now measure the current tool view after consent.
      window.dispatchEvent(new Event("mindbench-analytics-ready"));
    }
    setLoad(true);
    return () => setAnalyticsSender(null);
  }, [id, ready, consent.analytics, pathname]);
  return load && id ? <Script id="mindbench-ga4" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" onError={() => setAnalyticsSender(null)}/> : null;
}
