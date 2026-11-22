# OPENCODE-TEST-008 — Production Sync Failure Handling & Recovery Report

**Result: A PASS · B BLOCKED · C BLOCKED · D PASS (client-simulated only) · E PASS.**

Issue: https://github.com/yanbing2026/kindergarten-classroom/issues/90

## 1. Environment

| Item | Value |
| --- | --- |
| Production URL | https://blockquest-classroom.pages.dev/ |
| Observed app version | `v2-20261122-progress-flush` (read from deployed `APP_VERSION`) |
| UTC test window | `2026-11-22T21:13:15.540Z` → `2026-11-22T21:13:19.866Z` (from attached `results.sanitized.json`) |
| Timezone note | UTC timestamps from `Date().toISOString()`; runner local clock is US Eastern |
| Browser | Google Chrome `157.0.8103.38`, headless, driven by `puppeteer-core` |
| Device / viewport | `1280×900` headless desktop on Linux; **no mobile emulation, no physical hardware** |
| Account | one newly created synthetic disposable account, aliased **TEST-A**; no PINs, tokens or identifiers recorded |

## 2. Step 1 — read-only inspection for a safe failure-injection mechanism

Sources reviewed (read-only, no edits): `worker/src/index.js`, `worker/README.md`, `docs/cloud-backend-d1.md`, `js/cloud-api.js`.

Findings:
- The documented API contract covers `/salt`, `/create`, `/login`, `/me`, `/progress`, `/events`, `/report`, `/pin`, `/player` with normal success/error responses. Curl smoke tests are for healthy flows.
- There is **no** documented test-only header, endpoint, query parameter or payload for inducing a server-side 5xx/timeout.
- `worker/src/index.js:526-529` has a generic catch-all that returns `{ok:false,error:'server_error'}` with HTTP 500 for unhandled Worker errors, but no safe, documented, account-scoped way to trigger it through the public API.
- Therefore, per the issue's mandatory rule, no injection mechanism was invented and no production outage was attempted.

## 3. Scenario results

| # | Scenario | Result | Classification | Observed |
| --- | --- | --- | --- | --- |
| A | Baseline healthy sync | **PASS** | genuine production Worker behavior | Version matched. TEST-A diamonds `0 → 1` after one correct answer, and `1` after immediate logout and re-login. Mastery `{}` → `letters_L1:{A:1}`. Worker accepted and persisted the reward. |
| B | Genuine Worker-side failure / timeout | **BLOCKED** | not tested | No existing safe documented production failure-injection path (see §2). Not simulated or faked. |
| C | Recovery after genuine failure | **BLOCKED** | not tested | Conditional on B; B is BLOCKED, so no recovery scenario could be run. |
| D | Client-side simulated interruption | **PASS** | **client-simulated — NOT Worker-side failure** | With Chrome set offline after earning, sync status read `☁️ Syncing…` (not false `Saved`). After restoring the network and re-logging in: stars `1 → 2 → 2` — no loss, no duplicate. **Does not satisfy B or C.** |
| E | No collateral impact / errors | **PASS** | genuine production observation | Final TEST-A stars `2`. 3 console errors and 3 failed requests, all `net::ERR_INTERNET_DISCONNECTED` from the intentional offline probe. No unexpected errors; no other account accessed or modified. |

## 4. Redacted network evidence

Only method, host, path, HTTP status and duration were captured — **no headers, authorization tokens, cookies, request/response bodies, PINs or learner identifiers**.

- Total Worker responses: **21** = **14 application requests** (all HTTP 200) + **7 OPTIONS preflights** (HTTP 204).
- Endpoints: `/salt` 3 POST, `/create` 1 POST, `/login` 2 POST, `/me` 3 GET, `/progress` 2 POST, `/events` 3 POST, plus the corresponding preflights.
- Response duration range: **16–444 ms** (per-response values in `network.sanitized.json`).
- No 4xx/5xx responses were observed during the final clean run.

Authoritative machine-readable evidence: `test-reports/test008/results.sanitized.json` and `test-reports/test008/network.sanitized.json`. Their totals agree (21 = 14 + 7) and timestamps match.

## 5. Screenshots

Under `test-reports/test008/`, with the **actual capture stage** stated explicitly:

| File | Capture stage | Visible diamonds |
| --- | --- | ---: |
| `test008-01-post-reward-relogin.png` | Scenario A end — after the reward and after logout/re-login (initial name `test008-01-baseline.png` was misleading; corrected) | 1 |
| `test008-02-post-client-relogin.png` | Scenario D end — after client-simulated offline recovery and re-login | 2 |
| `test008-03-final.png` | Scenario E final state | 2 |

All three visibly show **“Hi, TEST-A!”**. The account chip/bar was hidden and the greeting replaced with the synthetic alias **at capture time only** (no application behavior changed); no credentials, account identifiers or learner data appear. **No pre-reward screenshot was captured** — the true pre-action baseline (`0` diamonds) exists only as machine-readable values, not as an image.

Identity/stage evidence: `results.sanitized.json` → `evidence.screenshot_context` records `{alias, accountState:"signed-in", stage, visibleDiamonds, valueSource}` for each file; the visible-diamond values come from the same run's scenario observations (A: `0 → 1 → re-login 1`; D: `afterRelogin 2`; E: `final stars=2`). `evidence.baseline` records alias `TEST-A`, redacted key prefix `kcqafail…`, `stars: 0`, and empty mastery, tying the starting state to the synthetic account. (Earlier drafts had a stale alias check producing `Hi, Guest!` images and misleading file names; both were corrected and the run repeated — the committed files are from the corrected run.)

## 6. Incidental observation (out of TEST-008 scope, not fixed)

During account setup, a 21-character synthetic name was rejected by `POST /create` with HTTP 400 `bad_request`. `worker/src/index.js:151` enforces a **20-character** name limit while the client input allows 24 (`index.html`, account modal `maxlength="24"` and regex `{2,24}`). This is a client/server validation mismatch; it is recorded here only as an observed setup obstacle. No application or Worker code was changed, and it is not a progress-sync finding.

## 7. Limitations / not tested

- **No genuine Worker-side 5xx or timeout was produced.** B/C are BLOCKED by design; D is browser-offline only and must not be read as server-failure coverage.
- Single synthetic account; headless desktop Chrome only; no physical device, mobile emulation, other browsers, screen reader or full accessibility audit.
- Only one reward path was exercised; no exhaustive curriculum, offline/PWA installation, or long-duration sync testing.
- No application, Worker, D1, secret, configuration or deployment changes; no accounts reset, deleted or mutated beyond normal learning interactions of TEST-A.

## 8. Deliverable

Test-only branch `test/opencode-test-008-report`; PR contains only this report, three screenshots and two sanitized JSON evidence files. Open and unmerged pending independent review; no deployment.
