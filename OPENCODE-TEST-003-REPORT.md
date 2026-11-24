# OPENCODE-TEST-003 — Mobile Production Usability & Regression Report

**Result: PASS (6 PASS / 0 FAIL / 0 BLOCKED)** — no mobile usability or regression defect found in the tested scope.

Issue: https://github.com/yanbing2026/kindergarten-classroom/issues/77

## 1. Environment

| Item | Value |
| --- | --- |
| Production URL | https://blockquest-classroom.pages.dev/ |
| Test window (UTC) | `2026-11-21T18:51:30Z` → `2026-11-21T18:51:51Z` |
| Device | **Chrome device emulation — NOT a physical phone.** Puppeteer viewport emulation with a Pixel 7 / Android 13 user-agent and touch events enabled. Android version is a user-agent label only; no real Android OS was involved. |
| Browser | Google Chrome `157.0.8103.38`, headless |
| Viewports tested | `360×800` portrait, `390×844` portrait, `800×360` landscape |
| Test identities | disposable synthetic accounts **A**, **B**, and **Guest** only; no real child names, personal data, or credentials recorded |
| Test data created | synthetic nicknames `小安` (A), `小贝` (B), `小客` (Guest); one quiz answer on A changed its diamonds from 0 to 1. No other production data touched. |

Because no physical phone was available, all results below are **emulated mobile-browser acceptance-test results**, not physical-device acceptance, and must not be read as physical-device certification.

## 2. Result table

| Case | Result | Steps | Observed result | Evidence |
| --- | --- | --- | --- | --- |
| **A. Responsive layout** | **PASS** | At 360×800 and 390×844: load home, open Settings, focus the nickname field, open a learning screen. | `documentElement.scrollWidth` equalled viewport width at both sizes (360 / 390); no unintended horizontal scrolling; no key element (top bar, greeting, today card, grade cards, More cards, settings dialog, prompt, choices) fell outside the viewport in portrait. With the nickname field focused, the input and Save button were both inside the viewport and the input was `document.activeElement`. | `test003-A-home-360x800.png`, `test003-A-settings-360x800.png`, `test003-A-home-390x844.png`, `test003-A-settings-390x844.png`, `test003-A-keyboard-focus-390x844.png`, `test003-A-learning-390x844.png` |
| **B. Touch interaction** | **PASS** | Use touch taps (not mouse clicks) for theme icon, grade card, settings Save, learning choice; tap the theme icon and a grade card twice. | All key controls responded to taps. Touch targets: account chip 80×44, icon buttons 44×44, grade cards 82×60, More cards 64×60, today card 350×210 (CSS px). Two hidden `.icon-btn` elements reported 0×0 (display:none Blipola microphone on non-home screens) — not user-facing. Double-tapping the theme icon produced exactly one dialog element; double-tapping a grade card left a single grades screen with 5 course cards, no duplicated UI or JS error. No hover-only control was required. | `test003-B-touch-390x844.png` |
| **C. Account & nickname regression** | **PASS** | A→B→A switching with nicknames; refresh; navigate away and back; logout to Guest, set Guest nickname, return to A, logout again. | A consistently showed `Hi, 小安!` (before/after refresh, after switching back, after navigation, after Guest); B showed its account name before setting a nickname and then `Hi, 小贝!`; Guest showed `Hi there!` then `Hi, 小客!`; returning to A still showed `Hi, 小安!`, and logging out again still showed `Hi, 小客!` — no cross-account or Guest leakage. | `test003-C-guest-390x844.png` |
| **D. Navigation & lifecycle** | **PASS** | Navigate to grades, refresh, browser back/forward, in-app back button, reopen site in a new tab. | Refresh reset the screen to `home` while account (`kcqatesta20261121`) and nickname (`小安`) persisted — consistent with the app's in-memory screen state. In-app back returned to `home`. Browser Back navigated out of the SPA to the prior history entry (`about:blank` in this harness) and Browser Forward returned to the production URL with the app intact; no blank screen or navigation trap inside the app. New tab showed `Hi, 小安!` with the same account, as expected from shared same-origin storage. | `test003-D-lifecycle-390x844.png` |
| **E. Learning flow smoke** | **PASS** | Tap today's START card, answer one question, then open Grades, Free Play, Draw, Grade 1. | Today card opened `play` with a prompt and 4 tappable choices; tapping a choice changed the disposable account's diamonds `0 → 1` (progress recorded on test account only). Grades, Free Play, Draw and Grade 1 screens all loaded with their primary controls visible and tappable. No exhaustive curriculum validation was attempted. | `test003-E-learning-390x844.png`, `test003-E-freeplay-390x844.png` |
| **F. Browser errors & accessibility basics** | **PASS** | Collect page/console errors, failed requests and HTTP ≥400 responses; focus the nickname field; rotate to 800×360 landscape. | 0 page errors, 0 console errors, 0 failed requests, 0 HTTP ≥400 responses in the clean run. Focused nickname field showed a visible browser focus outline (`auto 1px`); the visible "Name" section heading and placeholder (`e.g. Leo / 小明`) identify the field (there is no explicit `<label for>` element — noted below). Instructions and labels were not cut off. Landscape had no horizontal scrolling; cards below the fold were reachable by vertical scrolling (`body.scrollTop = 400` moved the More card from y≈640 to y≈156). | `test003-A-keyboard-focus-390x844.png`, `test003-F-lscape-800x360.png` |

## 3. Screenshots

All screenshots live in `test-reports/test003/` on this report-only branch. They show only synthetic nicknames and generic UI; no real names, credentials, or tokens. Key files are listed in the evidence column above.

## 4. Defects, severity and impact

**No application defect was found; no defect reproduction steps apply.** Nothing observed blocks ordinary mobile use.

Observations that are explicitly **not** defects:

1. **409 console errors in an earlier draft run.** The first run logged four `Failed to load resource: 409` console errors. Investigation showed these came from the *test harness* attempting **Create account** for accounts that already existed from TEST-002. A targeted probe reproduced it exactly: `409 POST https://blockquest-api.yanbing2004.workers.dev/create` with status text `That player name already exists on another device.` The final clean run logged in directly instead and recorded **0** console errors and **0** HTTP ≥400 responses. This was a test-procedure artifact, not a product failure; no code change was made.
2. **Browser Back behavior.** The app is an SPA with its own in-app back button and does not push history entries. Browser Back therefore leaves the site rather than stepping through app screens. In-app back works correctly, so this is consistent with intended behavior, but it is worth noting for anyone expecting browser-history navigation.
3. **Landscape below-fold cards.** At 800×360 the grade/More cards start below the viewport, but vertical scrolling reveals them; no content is unreachable.
4. **No explicit `<label for>` on the nickname input.** The field has a visible "Name" section heading and a placeholder, and shows a focus outline; no label was cut off. Recorded as an accessibility observation, not a functional failure.

Severity: **none** (no FAIL cases). Whether it blocks ordinary mobile use: **no**.

## 5. Tested vs not tested

**Tested:** production site in emulated Chrome at the three viewports above; touch taps on navigation, settings, account/login/logout and learning controls; A/B/Guest nickname isolation and persistence; refresh, browser back/forward, in-app back, new tab; one learning answer and progress change on a disposable account; console/page/network error capture; focus outline and orientation change.

**Not tested:** a physical Android device or any OS-level touch/keyboard behaviour; the real on-screen software keyboard (headless emulation cannot display it — only field/button visibility under focus was checked); other browsers (Safari/Firefox), screen readers, offline/PWA installation, pull-to-refresh, other orientations than the three listed, exhaustive curriculum/content correctness, performance profiling, or any non-test account's data. Account creation was not repeated in the final run — existing disposable accounts were reused via the normal login UI.

## 6. Completion

- Report and screenshots committed on dedicated branch `test/opencode-test-003-report`.
- Report-only PR opened against `main`, titled `TEST-003: mobile production acceptance report`, description: `Report only — do not merge; no application code changed.`
- No application code, backend, schema, deployment, or production content changed; no merge or deploy performed.
