# Signed-Out Homepage QA Remediation Testing - 2026-04-22

## Local URL

- Dev server command: `npm run dev`
- Terminal-reported Local URL: `http://localhost:3000`

## Commands Run

| Command | Result |
|---|---|
| `npm install` | Passed; 475 packages installed; npm audit reported 1 high severity vulnerability |
| `npm run test -- src/components/landing/homepage.test.tsx src/components/home/home-category-components.test.tsx src/app/page.test.tsx src/lib/utils.test.ts` | Passed; 4 files, 14 tests |
| `npm run test -- src/lib/homepage-model.test.ts src/components/landing/homepage.test.tsx src/components/home/home-category-components.test.tsx` | Passed; 3 files, 29 tests |
| `npm run lint` | Passed |
| `npm run test` | Passed; 48 files, 247 tests |
| `npm run build` | Passed |
| `npx playwright test --project=chromium` | Passed; 28 tests |
| `npx playwright test --project=webkit` | Passed; 28 tests |

## Browser Verification

`agent-browser` was unavailable in the shell, so browser verification used Playwright against `http://localhost:3000`.

Observed signed-out Home page results:

- Browser title is `Daily Intelligence Briefing`.
- Top Events tab is selected by default.
- Top Events rendered 5 public cards from the generated public briefing.
- Top Events cards rendered 15 total `keyPoints` list items.
- Category tabs rendered for Tech News, Finance, and Politics while signed out.
- Clicking a gated category rendered the inline gate.
- Gate copy matched: `Create a free account to read Tech News, Finance and Politics`.
- Top Events stayed visible while the gate was open.
- Dismissing the gate returned to Top Events.
- Active category tab underline computed as `rgb(44, 95, 46)`.
- Old `Daily Intelligence Aggregator` branding was not present in body text.
- Unsupported Home hero copy and `Open full briefing` summary link were not present.
- Framework overlay count: 0.
- Console errors: none.
- Page errors: none.

## Remaining Checks

- Preview validation is still required before merge because local browser validation does not prove Vercel SSR, cookies, redirects, auth state, or environment behavior.
- Human validation is still required for real auth/session behavior if this branch proceeds toward merge.

## QA Reconciliation Follow-up

The first remediation pass claimed several fixes from implementation and broad tests, but the following were not yet fully proven line by line: Top Events underfill behavior when confirmed filtering produced fewer than 3 cards, `keyPoints` field-source correctness, missing/empty `keyPoints` safety before render, exact soft-gate dismissal behavior, active-tab computed underline color, Home structure order, date-label/link-date consistency, and explicit console/page-error absence on Home load.

### Signed-Out Home Reconciliation Matrix

| QA requirement | Expected per artifacts/report | Current observed implementation | Status | Evidence |
|---|---|---|---|---|
| Page renders signed out | Home loads with public briefing content and no blank page | Home loads public Top Events signed out | PASS | `tests/homepage.spec.ts`; Chromium/WebKit full runs |
| Product name | `Daily Intelligence Briefing` | Metadata/sidebar title use approved name; old body branding absent | PASS | `src/app/layout.tsx`; `src/components/app-shell.tsx`; `tests/homepage.spec.ts` |
| Home structure | Date label -> tab strip -> cards; no unsupported hero summary | DOM order asserted; old `Open full briefing` summary absent | PASS | `src/components/landing/homepage.tsx`; `tests/homepage.spec.ts` |
| Top Events default active | Top Events selected on initial load | `aria-selected="true"` on Top Events | PASS | `src/components/home/home-category-components.test.tsx`; `tests/homepage.spec.ts` |
| Top Events public count | 3-5 when model/pipeline data supports it | Local browser renders 5; model covers 4 available priority-top items and 2-item limited fallback | PASS | `src/lib/homepage-model.test.ts`; `src/components/landing/homepage.test.tsx`; `tests/homepage.spec.ts` |
| Date label fallback truth | Fallback briefing labeled with actual briefing date, not misleading `Today` | Helper compares briefing date key to request-date key; browser asserts label/date-link consistency | PASS | `src/lib/utils.test.ts`; `tests/homepage.spec.ts`; `src/app/page.test.tsx` |
| Category tabs visible | Top Events, Tech News, Finance, Politics visible signed out | Signed-out tabs stay visible even when category sections are empty | PASS | `src/components/home/home-category-components.test.tsx`; `tests/homepage.spec.ts` |
| Inline category gate | Category click renders inline gate; Top Events remain visible; no full-page redirect | Gate appears inside tab panel and Top Events cards remain visible | PASS | `src/components/home/home-category-components.test.tsx`; `tests/homepage.spec.ts` |
| Gate CTAs | Sign Up -> `/signup?redirectTo=/`; Sign In -> `/login?redirectTo=/` | Scoped gate links assert encoded redirectTo `/` | PASS | `tests/homepage.spec.ts` |
| Gate copy | Flow 6 copy: `Create a free account to read Tech News, Finance and Politics` | Exact copy rendered | PASS | `src/components/landing/homepage.tsx`; `tests/homepage.spec.ts` |
| Gate dismiss | User can close gate and return to Top Events with cards visible | Dismiss button returns active tab to Top Events and hides gate | PASS | `src/components/home/home-category-components.test.tsx`; `tests/homepage.spec.ts` |
| Top Events `keyPoints` | Render `BriefingItem.keyPoints` bullets; no matchedKeywords substitution | Correct field asserted; internal placeholder fields absent; missing/empty arrays safe | PASS | `src/lib/homepage-model.ts`; `src/components/landing/homepage.test.tsx`; `tests/homepage.spec.ts` |
| Rank number | `#1`-`#5` derived from `topRanked` order | Rank rendered per card index | PASS | Existing component behavior plus `tests/homepage.spec.ts` Top Events card count |
| `whyItMatters` | Why-it-matters section present | Section still rendered on Top Events cards | PASS | `src/components/landing/homepage.tsx`; `src/components/landing/homepage.test.tsx` |
| Source pills | Source names from `sources[].title`/related article source names, not keywords | Source-name rendering remains covered; keyword substitution rejected | PASS | `src/components/landing/homepage.test.tsx`; `src/components/home/home-category-components.test.tsx` |
| No authenticated-only content | No signed-in account controls/data on signed-out Home | Sign-out/RSS/preferences/newsletter text absent on Home | PASS | `tests/homepage.spec.ts` |
| Navigation/collapse controls | Home/History/Account links and collapse button visible | Existing shell/nav tests pass | PASS | `tests/dashboard.spec.ts`; Chromium/WebKit full runs |
| No critical console/hydration errors | Zero Home load console/page errors | Explicit Chromium/WebKit probe found `consoleErrors: []`, `pageErrors: []` | PASS | Browser probe against `http://localhost:3000`; `tests/homepage.spec.ts` diagnostics |
| Page-level error/retry state | Error state includes retry affordance if route fails | Route error boundary renders Retry page and invokes reset | PASS | `src/components/landing/homepage.test.tsx` |

### Follow-up Validation Results

| Command | Result |
|---|---|
| `npm install` | Passed; 1 high severity npm audit finding remains |
| `npm run test -- src/lib/homepage-model.test.ts src/components/landing/homepage.test.tsx src/components/home/home-category-components.test.tsx src/app/page.test.tsx src/lib/utils.test.ts` | Passed; 5 files, 37 tests |
| `npm run lint` | Passed |
| `npm run test` | Passed; 48 files, 252 tests |
| `npm run build` | Passed after correcting the normalized `HomepageEvent.keyPoints` display type |
| `npx playwright test tests/homepage.spec.ts tests/smoke/homepage.spec.ts --project=chromium` | Passed; 5 tests |
| `npx playwright test --project=chromium` | Passed; 30 tests |
| `npx playwright test --project=webkit` | Passed; 30 tests |

Explicit browser console/page-error probe against `http://localhost:3000/`:

| Browser | Title | Top Events | Key point items | Console errors | Page errors |
|---|---:|---:|---:|---:|---:|
| Chromium | Daily Intelligence Briefing | 5 | 15 | 0 | 0 |
| WebKit | Daily Intelligence Briefing | 5 | 15 | 0 | 0 |
