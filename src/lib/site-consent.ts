export const CONSENT_KEY = "mindbench-privacy-v1";
export const CONSENT_CHANGED = "mindbench-privacy-changed";
export type SiteConsent = { version: 1; analytics: boolean; advertising: boolean };
export const NO_CONSENT: SiteConsent = { version: 1, analytics: false, advertising: false };

export function parseConsent(raw: string | null): SiteConsent | null {
  try {
    const value = JSON.parse(raw ?? "null");
    return value?.version === 1 && typeof value.analytics === "boolean" && typeof value.advertising === "boolean"
      ? { version: 1, analytics: value.analytics, advertising: value.advertising } : null;
  } catch { return null; }
}
