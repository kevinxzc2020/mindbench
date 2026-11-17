import { stripLangPrefix } from "./i18n";

export type AdSenseMode = "off" | "preview" | "live";
/**
 * Standard Google ad sizes, as [min available width px, width, height]. The width is the space
 * the ad's own container has (CSS container queries), not the screen, so an ad never overflows.
 * banner: top-of-tool leaderboard; content: between content blocks; rail: margin skyscraper;
 * anchor: sticky bottom bar.
 * The CSS in globals.css (.ad-unit-*) must use the same breakpoints.
 */
export const AD_SIZES = {
  banner: [[0, 320, 100], [728, 728, 90]],
  content: [[0, 300, 250], [728, 728, 90], [970, 970, 90]],
  rail: [[0, 160, 600]],
  anchor: [[0, 320, 50], [728, 728, 90]],
} as const;
export type AdSize = keyof typeof AD_SIZES;
export function adSizeFor(placement: AdPlacement): AdSize {
  return placement === "rail" ? "rail" : placement === "anchor" ? "anchor" : placement === "top" ? "banner" : "content";
}
/** Manual display placements. All sit between content blocks, never inside a test or game surface. */
export type AdPlacement = "anchor" | "rail" | "top" | "home" | "home-mid" | "home-bottom" | "result" | "tool" | "collection" | "content";

// Verified in the owner's AdSense account. This is a public identifier, not a secret.
const MINDBENCH_PUBLISHER = "ca-pub-7552640548182350";

/** Public publisher settings; Next.js embeds these values at build time. */
export function getAdSenseConfig() {
  const configuredMode = process.env.NEXT_PUBLIC_ADSENSE_MODE;
  const mode: AdSenseMode = configuredMode === undefined
    ? process.env.NODE_ENV === "development" ? "preview" : "off"
    : configuredMode === "preview" || configuredMode === "live"
      ? configuredMode
      : "off";
  const publisher = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? MINDBENCH_PUBLISHER).trim();
  const homeSlot = process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT?.trim() ?? "";
  const resultSlot = process.env.NEXT_PUBLIC_ADSENSE_RESULT_SLOT?.trim() ?? "";
  // One display unit may serve every in-content placement; falls back to the homepage unit.
  const displaySlot = process.env.NEXT_PUBLIC_ADSENSE_DISPLAY_SLOT?.trim() || homeSlot;
  const rewardedUnitPath = process.env.NEXT_PUBLIC_AD_MANAGER_REWARDED_UNIT_PATH?.trim() ?? "";

  return {
    mode,
    clientId: /^ca-pub-\d{16}$/.test(publisher) ? publisher : null,
    homeSlotId: /^\d+$/.test(homeSlot) ? homeSlot : null,
    resultSlotId: /^\d+$/.test(resultSlot) ? resultSlot : null,
    displaySlotId: /^\d+$/.test(displaySlot) ? displaySlot : null,
    rewardedUnitPath: /^\/\d+\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(rewardedUnitPath)
      ? rewardedUnitPath
      : null,
  };
}

/** Never send live ad requests from loopback previews. */
export function isLocalAdPreview(hostname: string) {
  return hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname === "::1"
    || hostname === "[::1]"
    || /^127\./.test(hostname);
}

/** Opt-in switch for AdSense Auto ads (vignette + side rail are chosen in the AdSense dashboard). */
export function autoAdsEnabled() {
  return process.env.NEXT_PUBLIC_ADSENSE_AUTO_ADS === "on";
}

/**
 * Pages where the Auto ads script may run. Device checks are included so Google's side rails
 * and bottom anchor can show beside them (overlays never cover a fullscreen test). Games,
 * validation pages, ability tests and account pages never load it, so nothing covers gameplay.
 */
const AUTO_ADS_EXACT = new Set(["/", "/about", "/collections", "/leaderboard", "/daily", "/stats"]);
const AUTO_ADS_PREFIXES = ["/collections/", "/drivers/", "/tools/", "/convert"];

export function isAutoAdsRoute(pathname: string) {
  // `/zh/tools/mouse` and `/tools/mouse` are the same page in two languages.
  const bare = stripLangPrefix(pathname.split(/[?#]/)[0]);
  const path = bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
  return AUTO_ADS_EXACT.has(path) || AUTO_ADS_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export const ADSENSE_SCRIPT_ID = "mindbench-adsense";
