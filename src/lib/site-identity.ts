export interface SiteIdentity {
  operator: string | null;
  email: string | null;
}

/** Only these explicitly public fields are passed from the server to info pages. */
export function getSiteIdentity(): SiteIdentity {
  const operator = process.env.SITE_OPERATOR_NAME?.trim() || null;
  const candidate = process.env.SITE_CONTACT_EMAIL?.trim() || "";
  const email = /^[^\s@<>"?&#]+@[^\s@<>"?&#]+\.[^\s@<>"?&#]+$/.test(candidate) ? candidate : null;
  return { operator, email };
}
