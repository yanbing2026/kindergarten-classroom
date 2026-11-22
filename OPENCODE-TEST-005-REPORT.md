# OPENCODE-TEST-005 — Learning Progress, Mastery, Retry & Reward Accounting Report

**Result: PASS — 7/7 checks passed (A1, A2a, A2b, A3, C1, C2, D); 0 FAIL, 0 BLOCKED.**

Issue: https://github.com/yanbing2026/kindergarten-classroom/issues/82

## 1. Environment

| Item | Value |
| --- | --- |
| Production URL | https://blockquest-classroom.pages.dev/ |
| UTC test window | `2026-11-22T01:52:13Z` → `2026-11-22T01:52:26Z` |
| Browser | Google Chrome `157.0.8103.38`, headless, driven via `puppeteer-core` |
| Viewport / device | `1280×900` headless **desktop**; no mobile emulation, no physical device |
| Account | existing **synthetic disposable account A** from TEST-002…004 only. No other account used or modified. |
| Data changes | diamonds `7 → 12`; mastery `letters_L1` gained `B:2` and `Q:1`; details in §5 |

No internal state was injected or manipulated to manufacture results. All actions were normal UI taps (START, answer choices, Home, sign out/in); app state was only **read** as supporting evidence.

## 2. Results

| Case | Result | Reproducible steps | Expected vs observed | Evidence |
| --- | --- | --- | --- | --- |
| **A1 — Q1 correct reward & mastery** | **PASS** | Sign in → tap START → Q1 → select correct choice → tap it twice more rapidly. | Expected: correct feedback, one answer reward, mastery +1, rapid taps add nothing. Observed: choice `B` turned green; diamonds `7 → 10`; mastery `B:1 → 2`; rapid taps left both unchanged. The `+3` total is **+1 answer + a natural +2 LEVEL UP** (B reached mastery threshold 2). | `test005-01-question1.png`, `test005-02-correct-feedback.png` |
| **A2a — Wrong answer** | **PASS** | Q2 → select a choice that is not the question's `itemId`. | Expected: incorrect feedback, no diamond, retry queued. Observed: choice `T` turned red/disabled; diamonds `10 → 10`; `firstAttempt=false`; `retryQueue=["Q"]`. | `test005-03-question2.png`, `test005-04-wrong-feedback.png` |
| **A2b — Correct retry & queue advance** | **PASS** | On the same Q2 select the correct choice; let the round advance. | Expected: one diamond for the retry, queue consumed, next question targets the missed item. Observed: choice `Q` turned green, diamonds `10 → 11`; next question `Find the letter Q` with `correctId=Q` (the missed item) and `retryQueue=[]`. | `test005-05-retry-advanced.png` |
| **A3 — Retry question** | **PASS** | Answer Q3 (`Find the letter Q`) correctly. | Expected: one diamond, mastery for Q begins. Observed: choice `Q` turned green, diamonds `11 → 12`, mastery `Q: 0 → 1`. | `test005-06-retry-answered.png` |
| **C1 — UI/internal consistency & same-context persistence** | **PASS** | Use in-app Home, refresh, sign out then sign back in via UI. | Expected: visible badge equals internal stars and values persist. Observed: badge `💎12` matched internal `stars=12`; refresh and re-login both `12`, mastery unchanged `{A:2,B:2,Q:1}`. | `test005-07-final-progress.png` |
| **C2 — Server persistence** | **PASS** | Fresh isolated browser context (no shared localStorage), sign in as A. | Expected: match if server-persisted. Observed: `stars=12`, same mastery and world stage — **server persistence established**, not merely same-device state. | `test005-08-isolated-context.png` |
| **D — Errors / regression** | **PASS** | Monitor page/console/network for the clean run; inspect final UI. | Expected: no errors, no stuck or duplicated UI. Observed: 0 page errors, 0 console errors, 0 failed requests, 0 HTTP ≥400; one top bar, no dialogs, no loading text, retry queue empty. | screenshot set below |

## 3. Per-question evidence (no guessed correctness)

| # | Visible prompt | Choices | Correctness proof | Selected | Feedback | Diamond delta |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | `Which letter does this start with? ⚽` | `B`, `F`, `C`, `K` | soccer ball → **B**; question `itemId = B` | `B` | green `.correct` | `7 → 10` = **+1 answer +2 level-up** |
| Q2 | `Which letter does this start with? 👸` | `T`, `U`, `C`, `Q` | queen → **Q**; question `itemId = Q` | `T` (wrong) | red `.incorrect`, disabled | `10 → 10` (**+0**) |
| Q2 retry | same question | same choices | same `itemId = Q` | `Q` | green `.correct` | `10 → 11` (**+1**) |
| Q3 | `Find the letter Q` | `Q`, `G`, `P`, `J` | displayed letter Q; `itemId = Q` | `Q` | green `.correct` | `11 → 12` (**+1**) |

Level-up note: the `LEVEL UP! Letters mastered! +2 💎` banner appeared naturally on Q1 when `letters_L1.B` reached the mastery threshold of 2. It is **not** a per-answer reward. The banner text was still present in the DOM for a short time during Q2 snapshots (it is removed after ~1.7 s); only the Q1 answer is credited with it.

## 4. Mastery, retry state and level/XP

- Mastery for `letters_L1`: baseline `{A:2, B:1}` → final `{A:2, B:2, Q:1}`. Q1 first-try correct raised `B` from 1 to 2 (mastery threshold, triggering the level-up). Q3 first-try correct created `Q:1`. The Q2 wrong answer did **not** change mastery (its item was not yet mastered/due).
- Retry state: `[]` → after wrong Q2 `["Q"]` → after correct retry `[]`, with the next question generated for item `Q`. Final queue `[]`; no stuck retry state.
- **Level/XP:** the app does not expose a numeric level or XP field in this UI. The only progression indicator observed is the diamond-based world stage, which advanced from **Spawn Point** (7 diamonds) to **Forest** (12 diamonds). This is reported as observed, not invented as XP.

## 5. Exact progress changes made to synthetic account A

| Moment | Diamonds | Mastery (`letters_L1`) | World stage |
| --- | ---: | --- | --- |
| Baseline | 7 | `A:2, B:1` | Spawn Point |
| After Q1 correct (incl. level-up) | 10 | `A:2, B:2` | Forest |
| After Q2 wrong | 10 | unchanged | Forest |
| After Q2 correct retry | 11 | unchanged | Forest |
| After Q3 correct | 12 | `A:2, B:2, Q:1` | Forest |
| After refresh / sign-out-in / isolated context | 12 | unchanged | Forest |

Net change: **+5 diamonds** (+1 Q1 answer, +2 natural level-up, +0 wrong answer, +1 Q2 retry, +1 Q3 answer). No progress was reset, deleted, or overwritten; no other account was touched.

## 6. Error/network summary and screenshots

- Page errors: **0**. Console errors: **0**. Failed requests: **0**. HTTP responses ≥400: **0**.
- Screenshots (all committed under `test-reports/test005/`, synthetic account UI only):
  `test005-00-baseline.png`, `test005-01-question1.png`, `test005-02-correct-feedback.png`, `test005-03-question2.png`, `test005-04-wrong-feedback.png`, `test005-05-retry-advanced.png`, `test005-06-retry-answered.png`, `test005-07-final-progress.png`, `test005-08-isolated-context.png`.

## 7. Tested vs not tested

**Tested:** three quiz questions on production (one correct with a natural level-up, one wrong plus correct retry, one retry-target question); per-answer reward and mastery deltas; retry queue advance; rapid duplicate taps; UI badge vs internal state; refresh; sign-out/in; isolated-context server persistence; error/network capture.

**Not tested:** physical devices or mobile emulation, other browsers, screen readers or a full accessibility audit, longer quiz rounds / other categories, deliberately forcing a level-up, offline/PWA behaviour, review-mode retry semantics, any other account, destructive cleanup, or any application/backend/configuration change.

No defect found; no fix attempted. Report-only PR, unmerged; no merge or deploy.
