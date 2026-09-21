# Leaderboard redesign

Implemented and checked locally on 2026-09-21.

## Scope

- Rebuilt `/leaderboard` in the homepage's ink / paper / vermilion editorial style.
- Grouped desktop game navigation; native grouped game selector on mobile.
- Retained every visible game from `GAMES`, all `DIFFICULTIES`, score formatting, scoring direction, and the existing scores endpoint.
- Added a selected-game challenge panel, direct play link, semantic results table, first-place emphasis, neutral avatars, and account CTA.
- Added scoped sweep / row-entry effects with a CSS reduced-motion override. No animation hides the results by default.
- Added initial loading, empty, error and retry states; a request timeout; cancellation and selection-key guards against stale results.
- The existing API merges generated fixtures and database records. This redesign leaves that behavior unchanged but visibly labels `synthetic` rows and explains demo data above the table. Displayed fixtures must not be described as real player activity.

## Verification performed

- TypeScript: `node_modules/.bin/tsc.cmd --noEmit --incremental false` passed.
- `git diff --check` passed.
- Next.js development route compiled and served successfully after restarting an unresponsive local preview server.
- Browser: desktop visual inspection at the default viewport, mobile at 390 × 844 and 320 × 740.
- English, Chinese and Spanish labels inspected; no horizontal page overflow in the inspected layouts.
- All 14 visible games selected through the mobile selector at Hell difficulty; each rendered its corresponding table and 20 API entries with appropriate score units.
- Reaction Time tested at Easy, Medium, Hard and Hell; corresponding captions and results changed.
- Desktop game and difficulty buttons tested, including Number Memory / Hard.
- Browser console error inspection returned no errors for the tested page.

## Not claimed

- No production build, deployment, database write, score authenticity verification or real-user traffic measurement.
- Empty/error/retry and reduced-motion paths are implemented and code-reviewed, but were not force-triggered in the browser.
- Only this page uses the new neutral avatar option; other avatar callers retain their existing default.

Sources: repository implementation in `src/app/leaderboard/page.tsx`, `src/app/leaderboard/leaderboard.module.css`, `src/components/UserAvatar.tsx`, `src/app/api/scores/route.ts`, `src/lib/utils.ts` and `src/lib/difficulty.ts`; local browser checks on the date above.
