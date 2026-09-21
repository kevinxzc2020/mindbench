# Legal pages and launch checklist

Reviewed against application code and the official sources below on 2026-09-21.

## Status

The information pages are implemented. **Legal readiness is not established.** The operator has not supplied a public contact address, operating jurisdiction, target markets or a decision about children. Do not interpret a footer, draft notice, `noindex` tag or this checklist as regulatory approval or a technical block on deployment.

There is no universally determined page bundle for this project yet. The route layout is an implementation choice; applicable obligations depend on actual operations. Do not label every route below legally mandatory merely because it exists.

| Route | Purpose | Current status |
| --- | --- | --- |
| `/privacy` | Account/score/storage/advertising disclosures | Expanded draft; real operator, providers, retention, bases and transfers still pending |
| `/terms` | Game use, accounts, fair play, assessment disclaimer, third parties | Expanded draft; no invented governing law, arbitration or liability cap |
| `/cookies` | Current first-party storage and optional advertising | Added draft; an explanation, not a consent mechanism |
| `/privacy-rights` | Conditional rights and request instructions | Added draft; explicitly states the lack of self-service deletion/export and a working request channel |
| `/contact` | Actual public contact when supplied | No made-up address or fake submission form |
| `/about` | Service and entertainment context | Existing factual description retained |

All pages follow the English, Chinese and Spanish selector and are linked in the shared footer. All four policy pages have draft notices and `noindex, follow` metadata. Adding public identity configuration does not automatically approve or finalise their wording.

The sign-in and registration pages show a short disclosure and links **before both email and Google flows**. It does not represent policy acceptance, parental permission or advertising consent, and there is no pretend consent checkbox or acceptance record.

## Evidence from this application

| Data / behaviour | Source inspected | Disclosure consequence |
| --- | --- | --- |
| Name, email and password hash at registration | `src/app/api/auth/register/route.ts` | Required for email registration; no account needed merely to play |
| Optional Google sign-in, profile, provider-account fields and tokens | `src/lib/auth.ts`, `prisma/schema.prisma` | Do not describe authentication as collecting only an email |
| Public user ID, display name, result and timestamp; explicitly labelled demo records | `src/app/api/scores/route.ts`, `src/app/leaderboard/page.tsx` | Explain public rankings before account creation |
| Score submissions/errors written to logs | `src/app/api/scores/route.ts` | Include technical records; hosting/logging/backup policy remains unverified |
| JWT authentication cookies | `src/lib/auth.ts`; installed `next-auth/core/init.js`, `core/lib/cookie.js`, `core/lib/oauth/checks.js`, `core/routes/session.js` | Rolling 30-day login expiry; session callback/CSRF cookies; OAuth checks use 15-minute expiry when used |
| Browser language preference | `src/lib/language-context.tsx` | `mb-lang`, no application-set expiry; distinct from consent |
| Optional live AdSense, preview/off modes | `src/lib/adsense.ts`, `src/components/AdSenseBanner.tsx` | Preview does not load the ad script; no implemented CMP/withdrawal UI; this change does not enable live ads |
| No self-service account deletion, full export or privacy-request submission flow found | `src/app/api`, `src/app/profile`, `src/app/stats` | Do not promise a functioning request button or automatic deletion |

Cookie names and lifetimes describe this checked dependency/configuration, not an exhaustive production-vendor scan. The schema and source are not proof of production data location. Recheck the deployed network/storage behaviour after choosing hosting and advertising providers.

## Decisions and operational work still required

- Identify the real operator, operating country and intended audience. Confirm the identity/contact disclosures needed there. A brand name alone must not be assumed sufficient. Ask for representative/DPO details only if actually applicable; do not invent them.
- Configure a monitored public contact channel. Establish secure, proportionate identity verification and processes for requests, deletion/export/correction, escalation, backups and applicable response deadlines. A `mailto:` link alone does not implement these processes.
- Inventory production recipients/providers, purposes, retention criteria, logging, backups, locations, international transfers and safeguards; confirm processing bases where required. Replace each pending paragraph with verified operational details.
- Decide the target age group. Review child-directed service/actual-knowledge rules and implement the relevant age and parental-consent safeguards. A sentence saying “13+” or a checkbox alone has not been treated as resolving this.
- Keep advertising in `off` or `preview` while production privacy setup is unresolved. `live` is currently a manual switch, not a verified consent gate. Configure and test the actual CMP, refusal/withdrawal behaviour, ad providers and legally applicable opt-outs/preference signals before enabling live advertising.
- Review local business/imprint, consumer, accessibility and other jurisdiction-specific obligations once location/audience are known. No universal determination has been made. No shop/subscription checkout was found, so refund, shipping and cancellation policies have not been invented for nonexistent transactions.
- Review final Terms and a consistent presentation/acceptance approach across email and OAuth. Do not backdate acceptance or silently claim existing users agreed to this draft.
- Confirm translations, publish real effective/update dates and a material-change notice process. Remove draft/noindex only after reconciling final language with actual operations. Obtain appropriate jurisdiction-specific legal review; this code change is not a legal opinion.

## Official references

These are conditional review references, not a determination that each law applies to MindBench.

- [EU GDPR, Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng), Official Journal publication 2016-05-04. Article 13 covers controller identity/contact and privacy information where applicable. It is why missing operator and processing details are not silently omitted from the policy draft.
- [Google AdSense — Required content](https://support.google.com/adsense/answer/1348695?hl=en), publication date not displayed; checked 2026-09-21. Advertising disclosures must match actual providers and include appropriate personalisation opt-out information.
- [Google AdSense — Publisher CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en), publication date not displayed; checked 2026-09-21. Personalised advertising to EEA/UK/Swiss users requires a Google-certified TCF CMP; certification is not an assurance of full legal compliance.
- [FTC — Children's Online Privacy Protection Act](https://www.ftc.gov/legal-library/browse/statutes/childrens-online-privacy-protection-act), publication date not displayed; checked 2026-09-21. Child-directed commercial services and knowing collection from children under 13 can trigger parental notice/consent and other duties. The operator's audience is unresolved.
- [NextAuth.js — Options](https://next-auth.js.org/configuration/options), checked 2026-09-21, plus the installed dependency source named above for the exact current cookie settings. Re-audit after dependency/configuration changes.
- [Google Privacy Policy](https://policies.google.com/privacy?hl=en), effective 2026-04-02, and [Google partner-site data information](https://policies.google.com/technologies/partner-sites?hl=en), publication date not displayed; both checked 2026-09-21. Direct links are included alongside advertising settings on the relevant pages.

## Verification record

- TypeScript `--noEmit --incremental false` and `git diff --check` passed after the final code changes.
- Opened all six information routes through browser navigation. The four policy routes each emitted `noindex, follow`; the new pages displayed draft notices and current section content.
- Verified Chinese desktop pages, Spanish at 390 × 844 and English at 320 × 740. Cookie text, privacy-rights content and the expanded footer had no horizontal page overflow in those checks. Desktop screenshot and mobile screenshots were visually reviewed.
- Verified registration disclosure precedes the form, with correctly linked field labels; verified the login disclosure and policy links. OAuth is conditional and was not visible in this preview; source order places the notice before that component as well. No auth forms were submitted.
- Confirmed the unconfigured contact page has no mailto link and no form. The privacy-rights page has no pretend request form.
- Browser error log returned no entries during the final check. Restored Chinese and the default viewport and left the privacy policy open for review.
- No registration submission, deletion, external policy acceptance, production deployment or live-ad activation is part of this change.
- No production build or complete jurisdiction-specific compliance audit was run. Existing unrelated working-tree changes were retained.
