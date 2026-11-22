# OPENCODE-TEST-007 — BUG-001 Production Regression Report

**Result: PASS — 5/5 scenarios PASS (plus error/network check PASS).** All tests ran against the deployed production application and the **real** Cloudflare Worker/D1 backend; no mocked cloud API was used in the final run.

Related: issue #88 · BUG-001 #86 · fix PR #87 (merged as `fda63572`)

## 1. Environment

| Item | Value |
| --- | --- |
| Production URL | https://blockquest-classroom.pages.dev/ |
| Observed app version | `v2-20261122-progress-flush` (read from `APP_VERSION` in the deployed page) |
| UTC test window | `2026-11-22T04:21:07Z` → `2026-11-22T04:21:18Z` (final clean run) |
| Browser | Google Chrome `157.0.8103.38`, headless, driven by `puppeteer-core` |
| Device / viewport | `1280×900` **headless desktop**; no mobile emulation, no physical device |
| Accounts | two **newly created synthetic disposable accounts**, referred to only as **TEST-A** and **TEST-B**. No PINs, tokens, auth headers, or real learner data were recorded or shown. |
| Backend | real production API at `blockquest-api.yanbing2004.workers.dev` (endpoints `/salt`, `/create`, `/login`, `/me`, `/progress`, `/events`); no mocks |

## 2. Scenario results

| # | Scenario | Result | Before → after (TEST-A unless noted) | Evidence |
| --- | --- | --- | --- | --- |
| 1 | One reward, immediate logout, re-login | **PASS** | diamonds `0 → 1` (earned) → `1` (re-login); mastery `{}` → `letters_L1: {A:1}` | `test007-02-one-reward.png` |
| 2 | Three rapid rewards, immediate logout, re-login | **PASS** | diamonds `1 → 4` → `4`; mastery `letters_L1: {A:1}` → `{A:1,B:1,C:1,D:1}` | `test007-03-rapid-rewards.png` |
| 3 | Refresh, then logout/re-login | **PASS** | diamonds `4 → 5` (earned) → `5` (refresh) → `5` (re-login) | `test007-04-refresh.png` |
| 4 | A/B isolation with distinct progress and immediate switching | **PASS** | TEST-A `5 → 7 → 7 → 7` (mastery `{A:1..G:1}`); TEST-B `0 → 1 → 1` (mastery `{A:1}`). Switch order A→B→A→B→A with **immediate** logout each time; neither account lost its own value or gained the other's. | `test007-05-isolation.png` |
| 5 | Real backend + failure signalling | **PASS** | 57 worker calls (final run: 62 total incl. preflights), paths `/create`, `/login`, `/me`, `/salt`, `/progress`, `/events`, statuses only `200`/`204`; offline probe below | network log §3 |
| E | Console / page / failed-request check | **PASS** | 3 console errors and 3 failed requests, **all** `net::ERR_INTERNET_DISCONNECTED` from the intentional browser-offline probe (2× `/events`, 1× `/progress`). No unexpected errors. | report text |

## 3. Real backend evidence (redacted)

Only method, host, path and HTTP status were captured — **no request headers, authorization tokens, cookies, bodies, PINs or credentials were logged**.

Observed production Worker calls (status counts across the run):

| Endpoint | 200 | 204 |
| --- | ---: | ---: |
| `/salt` | 11 | 1 |
| `/create` | 2 | 1 |
| `/login` | 9 | 1 |
| `/me` | 11 | 1 |
| `/progress` (save) | 6 | 1 |
| `/events` | 16 | 2 |

The `/progress` calls confirm reward state was written to the production backend; no 4xx/5xx statuses were observed. This distinguishes verified production behaviour from any mocked/local-only result.

**Failure-signalling probe (safe, browser-local):** after earning a reward with Chrome temporarily set offline, the sync indicator read `☁️ Syncing…` — it did **not** claim `☁️ Saved`. The offline `/progress` request failed with `net::ERR_INTERNET_DISCONNECTED`; after restoring the network and signing in again, the reward was still present (`7 → 8 → 8`). This shows failure was not reported as success and unsaved progress was recoverable. Injecting real server-side latency/failure was not attempted (see limitations).

## 4. Account changes made

Only the two newly created synthetic accounts were used. TEST-A finished with 8 diamonds and mastery `letters_L1` items A–G (plus the offline-probe reward); TEST-B finished with 1 diamond and mastery `{A:1}`. No other account, real learner data, or existing progress was accessed, modified, reset or deleted. The disposable accounts were left in place (no destructive cleanup).

## 5. Screenshots

All under `test-reports/test007/`: `test007-00-before-create.png`, `test007-01-accounts-created.png`, `test007-02-one-reward.png`, `test007-03-rapid-rewards.png`, `test007-04-refresh.png`, `test007-05-isolation.png`.

For evidence redaction, the account chip/bar were hidden and the home greeting was replaced with the aliases `Hi, TEST-A!` / `Hi, TEST-B!` **at screenshot time only**; no application state was changed by this. No credentials or tokens appear in any image.

## 6. Limitations / not tested

- Desktop headless Chrome only; no real device, mobile emulation, other browsers, screen reader, or full accessibility audit.
- No artificial server-side delay/failure was injected into the production Worker; the failure probe was browser-local offline mode only. Real-world backend timeout behaviour was not reproduced.
- A forced “in-flight A save vs B switch” race could not be deterministically produced against the live backend; scenario 4 used immediate real switches instead and verified the observable outcome.
- Earlier draft runs had harness issues (synthetic-name collision and a quiz-choice timing race: a correct answer `X` was briefly not present in the rendered options). These were test-script problems, were corrected, and are **not** product findings; only the final clean run above is reported.
- Rewards were earned only through the daily START activity. No exhaustive curriculum/backend validation, no purchases, external messages, or destructive operations.

## 7. Deliverable

Report and screenshots only, on dedicated branch `test/opencode-test-007-report`; report-only PR opened against `main`, left open and unmerged. No application code, backend, schema, configuration or deployment changes.
