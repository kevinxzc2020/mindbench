# Footer and information pages

Updated 2026-09-21.

## Implemented

- Removed the homepage's oversized `MINDBENCH ↗` decoration and its scroll-animation references. Hero pixels, text scramble and game-card effects remain.
- Added a compact shared footer with the existing generated logo, About, Contact, Privacy policy, Terms of use and copyright.
- Added `/about`, `/contact`, `/privacy` and `/terms`, with English, Chinese and Spanish content following the site's language selector.
- Extended the legal-page set with `/cookies` and `/privacy-rights`, expanded the privacy/terms drafts, and added policy links before authentication. See `LEGAL-READINESS.md` for the current scope and unresolved launch requirements.
- The owner has no public contact email yet. No address or operator name has been invented; unconfigured operator details are hidden. The contact page clearly says no channel is available and has no fake submission form.
- Privacy and terms are visible **drafts**, with `noindex, follow` metadata. They are not a statement that legal review or AdSense approval is complete.
- The Cookie and privacy-rights pages are also marked as drafts and noindex. Missing operator identity is explicitly noted on policy pages rather than silently hidden.

## Public contact configuration

Use `.env.site.example` as a reference. When real public details are available, set `SITE_CONTACT_EMAIL` and, if appropriate after review, `SITE_OPERATOR_NAME` in the local/deployment environment. Restart development or rebuild deployment afterwards.

Only these two public fields are passed to the information pages. A syntactically invalid email is treated as unconfigured. A configured email creates a `mailto:` link, not a backend email service.

## Required before treating policy drafts as final

- Confirm who is responsible for the site and what identity/contact disclosures apply to the operator and intended audience. A domain binding alone does not determine these obligations.
- Confirm production hosting/database and ad providers, storage locations, data retention and request-handling procedures. These details are deliberately not invented.
- Review the applicable legal basis, age/access rules, jurisdiction, rights, transfers and final wording with appropriate advice for the actual deployment.
- Reconcile privacy statements with the live deployment, then deliberately remove draft notices and noindex metadata only when ready.
- Review consent requirements before enabling live advertising. This footer change does not add a consent-management platform or change ad settings.

## Sources used for the draft (checked 2026-09-21)

- Repository: registration hashes passwords (`src/app/api/auth/register/route.ts`), authentication (`src/lib/auth.ts`), score submission and public leaderboard fields (`src/app/api/scores/route.ts`), language local storage (`src/lib/language-context.tsx`), optional live ads and localhost preview blocking (`src/lib/adsense.ts`, `src/components/AdSenseBanner.tsx`).
- Google AdSense, Required content, publication date not displayed: https://support.google.com/adsense/answer/1348695
- Google AdSense, Consent-management requirements, publication date not displayed: https://support.google.com/adsense/answer/13554116
- GDPR, Regulation (EU) 2016/679, published in the Official Journal 2016-05-04, Article 13 (identity/contact disclosure where applicable): https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679

No legal jurisdiction or regulatory applicability has been assumed for this operator.

## Verification (2026-09-21)

- TypeScript `--noEmit --incremental false` and `git diff --check` passed.
- Inspected the homepage footer at desktop size; the oversized wordmark is absent, all 14 game cards and the extra activities remain.
- Opened all four information routes in the browser. Privacy and terms have visible draft notices and `noindex, follow` metadata.
- Checked Spanish mobile layout at 390 × 844 and English at 320 × 740, with no horizontal overflow. Chinese desktop content and footer links were inspected as well.
- With public identity fields unconfigured, no operator identity or email link appears and the contact page states that messages cannot yet be submitted.
- Replayed the homepage hero effect after removing wordmark animation references: canvas entered `revealing`; browser error log was empty in this check.
- No new production build, deployment, account changes, live-ad activation, legal approval, commit or push.
