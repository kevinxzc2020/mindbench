export type AdSenseMode = "off" | "preview" | "live";

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
  const rewardedUnitPath = process.env.NEXT_PUBLIC_AD_MANAGER_REWARDED_UNIT_PATH?.trim() ?? "";

  return {
    mode,
    clientId: /^ca-pub-\d{16}$/.test(publisher) ? publisher : null,
    homeSlotId: /^\d+$/.test(homeSlot) ? homeSlot : null,
    resultSlotId: /^\d+$/.test(resultSlot) ? resultSlot : null,
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
 * Pages where the Auto ads script may run. Everything else — device checks (/tools),
 * games, validation pages, tests and account pages — never loads it, so full-screen
 * vignettes and side rails cannot cover an active check or game.
 */
const AUTO_ADS_EXACT = new Set(["/", "/about", "/collections", "/leaderboard", "/daily", "/stats"]);
const AUTO_ADS_PREFIXES = ["/collections/", "/drivers/"];

export function isAutoAdsRoute(pathname: string) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return AUTO_ADS_EXACT.has(path) || AUTO_ADS_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export const ADSENSE_SCRIPT_ID = "mindbench-adsense";
