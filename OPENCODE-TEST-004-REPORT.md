# OPENCODE-TEST-004 — Core Learning Interaction & Progress Regression Report

**Result: PASS — 7/7 checks passed (case groups A, B, B2, C, D all PASS; 0 FAIL, 0 BLOCKED).**

Issue: https://github.com/yanbing2026/kindergarten-classroom/issues/79

## 1. Environment

| Item | Value |
| --- | --- |
| Production URL | https://blockquest-classroom.pages.dev/ |
| Test window (UTC) | `2026-11-21T19:04:06Z` → `2026-11-21T19:04:20Z` (final clean run) |
| Browser | Google Chrome `157.0.8103.38`, headless, driven by `puppeteer-core` |
| Viewport / device type | `1280×900` **headless desktop** — no mobile emulation and no physical device in this task |
| Account type | existing **synthetic disposable account A** from TEST-002/TEST-003; Guest/account B not modified. No real child data used. |
| Production data touched | only account A's diamonds and mastery; details in §4 |

## 2. Results

| Case / check | Result | Reproducible steps | Expected vs observed | Evidence |
| --- | --- | --- | --- | --- |
| **A1 — START renders** | **PASS** | Sign in as A → tap the home **START / today adventure** card. | Expected: play screen with prompt and choices. Observed: `screen=play`, prompt `Find the letter B`, four choices `K, E, B, G`, correct answer `B` (also matches the displayed letter). | `test004-01-question1.png` |
| **A2 — Correct answer + rapid taps** | **PASS** | On Q1 tap choice `B` (the `itemId` of the question), then tap it twice more quickly. | Expected: correct feedback, exactly one correct-answer reward (plus any separate level-up bonus), duplicate taps ignored. Observed: button `B` gained `.correct`, `awaitingNext=true`, diamonds `5 → 6`; two extra rapid taps left diamonds at **6**. Mastery `letters_L1` went `{A:2}` → `{A:2, B:1}`. (An earlier draft run additionally showed a `+2` LEVEL UP banner, which is a separate legitimate bonus, not a duplicate reward.) | `test004-02-correct-feedback.png` |
| **A3 — Incorrect answer** | **PASS** | After auto-advance to Q2 (`Which letter does this start with? 🌳`, choices `C,G,Z,T`, correct `T`), tap wrong choice `C`. | Expected: incorrect feedback, no diamond, retry possible. Observed: button `C` gained `.incorrect` and became disabled, `firstAttempt=false`, `retryQueue=["T"]`, diamonds stayed **6**, `awaitingNext=false`; then tapping correct `T` awarded one diamond (`6→7`) and advanced to question 3. | `test004-03-question2.png`, `test004-04-wrong-feedback.png` |
| **B — Progress & device-local persistence** | **PASS** | Record progress → answer Q1 correct, Q2 wrong then correct → refresh → sign out via account popover → sign back in via normal UI. | Expected: only correct answers increase diamonds and values persist in the same context. Observed: diamonds `5 → 7` (two correct answers, none for the wrong answer); refresh `7`; sign-out/in `7`; local progress key present (1564 bytes). | `test004-00-before.png`, `test004-05-progress-after.png` |
| **B2 — Separate browser context (server persistence)** | **PASS** | Create a fresh isolated browser context with no shared `localStorage`, sign in as A, read progress. | Expected: if server-persisted, values match. Observed: isolated context showed `7` diamonds with the same account — **server persistence verified**, not merely device-local. | `test004-06-separate-context.png` |
| **C — Learning destinations** | **PASS** | From home tap Grades, Grade 1, Free Play, Draw; use in-app back each time; tap one Free Play filter; draw one stroke and undo. | Expected: each destination loads, controls respond, back returns home; no persistent content changes. Observed: `grades`/`grade1` screens loaded with course cards; Free Play filter changed visible cards `28 → 26`; Draw canvas image length `11418 → 17502 → undo 11418`; every in-app back returned to `home`. | `test004-07-freeplay.png`, `test004-08-draw.png` |
| **D — Errors / regression** | **PASS** | Monitor errors/network for the whole clean run; inspect final app state. | Expected: no errors, no stuck/blank/duplicated UI. Observed: 0 page errors, 0 console errors, 0 failed requests, 0 HTTP ≥400; final state `screen=home`, one `.topbar`, non-empty app, no loading text, no open dialogs. | screenshot set below |

## 3. Exact correctness evidence

Correctness was **not guessed**. For each question I recorded the app's own question object (`itemId`) and cross-checked it against the visible prompt/choices:

- **Q1** — prompt `Find the letter B`; choices `K / E / B / G`; `itemId = B`; the displayed letter is B. Selected `B` → correct feedback, +1 diamond.
- **Q2** — prompt `Which letter does this start with? 🌳`; choices `C / G / Z / T`; `itemId = T` (tree → T). Selected wrong `C` → incorrect feedback, no diamond; selected `T` → correct, +1 diamond.

## 4. Progress changes on the disposable account

| Moment | Diamonds | Notes |
| --- | --- | --- |
| Start of TEST-004 work (after TEST-003) | 1 | baseline inherited from earlier test tasks |
| End of first draft run | 5 | included a `+2` level-up bonus; draft assertions were corrected afterwards (no application change) |
| Final clean run — before | 5 | `letters_L1` mastery `{A:2}` |
| Final clean run — after | 7 | Q1 correct `+1`; Q2 wrong `+0`; Q2 retry correct `+1`; mastery gained `B:1`; `T` was queued for retry |
| After refresh / sign-out-in / isolated-context login | 7 | unchanged across all three checks |

Only account A was changed. No other account, learning progress, content, or configuration was modified. No accounts or progress were reset or deleted.

## 5. Screenshots

All files are under `test-reports/test004/` on this report-only branch and contain only synthetic test-account UI:

`test004-00-before.png`, `test004-01-question1.png`, `test004-02-correct-feedback.png`, `test004-03-question2.png`, `test004-04-wrong-feedback.png`, `test004-05-progress-after.png`, `test004-06-separate-context.png`, `test004-07-freeplay.png`, `test004-08-draw.png`.

## 6. Tested vs not tested

**Tested:** production site in headless desktop Chrome; daily START quiz prompt/choices; one correct answer, one wrong answer and one successful retry; rapid duplicate taps; diamonds/mastery before and after; refresh, sign out/in, and a genuinely separate browser context; Grades, Grade 1, Free Play (one filter tap) and Draw (one stroke + undo) with in-app back; page/console/network error capture.

**Not tested:** physical devices or mobile emulation (this task used desktop Chrome only), real Android/iOS touch or keyboard, other browsers, screen readers or a full accessibility audit, offline/PWA installation, exhaustive curriculum correctness, more than two questions, Draw export/publish/save, Free Play state changes beyond a filter tap, any non-test account, or any destructive operation.

No defect was found; no fix was attempted. No application code, backend, database, content, configuration, or deployment was changed. This PR is report-only and must not be merged.
