# OPENCODE-TEST-002 — Production Acceptance Test Report

**Result: PASS** — all 6 required test cases passed against production with a real browser and real (synthetic, disposable) child accounts.

Issue: https://github.com/yanbing2026/kindergarten-classroom/issues/75

## 1. Scope and environment

| Item | Value |
| --- | --- |
| Production URL | https://blockquest-classroom.pages.dev/ |
| Test window (UTC) | started `2026-11-21T17:28:08Z`, completed `2026-11-21T17:28:36Z` |
| Test window (Asia/Shanghai, UTC+8) | `2026-11-22 01:28:08` → `2026-11-22 01:28:36` |
| Browser | Google Chrome `157.0.8103.38`, headless (driven by `puppeteer-core`) |
| Device / viewport | headless desktop, `1120 × 820` |
| Test identities | **A**, **B**, **Guest** only — synthetic disposable accounts; no real child data, no credentials recorded here |
| Execution mode | **Production**, real browser, normal UI for every account operation. No `localStorage` injection was used to impersonate accounts. |

The runner's own clock was `EST (UTC-5)`; both UTC and Asia/Shanghai timestamps are given above so the test time is unambiguous.

## 2. Safety and boundaries

- No application code, database schema, backend, deployment settings, or production learning progress was changed.
- Two synthetic disposable accounts (A and B) were created/reused through the normal Create flow; account A had been created in a short pre-flight probe and was reused via the normal Log In flow. **No pre-existing account was modified or deleted.** The disposable accounts were intentionally left in place rather than deleted, to avoid any destructive operation on production data.
- No passwords, tokens, or other secrets appear in this report or in the screenshots.
- Before each screenshot, the account chip and account bar were hidden with a temporary CSS rule, so the images contain only synthetic nicknames and generic UI — no account identifiers.

## 3. Results

| # | Test case | Result | Exact observed behavior |
| --- | --- | --- | --- |
| 1 | Nickname persistence | **PASS** | With A signed in, setting `小明` immediately changed the greeting to `Hi, 小明!`; after a full page reload it was still `Hi, 小明!`. Stored value for A's key was `小明`. |
| 2 | Account isolation | **PASS** | Before setting a nickname, B showed `Hi, KCQATestB…!` (its account name), not A's nickname. After setting B to `Milo`: back to A → `Hi, 小明!`; back to B → `Hi, Milo!`. Neither nickname leaked into the other account. |
| 3 | Guest isolation | **PASS** | Logging out reached Guest (`Hi there!`). Setting Guest to `游客星球` gave `Hi, 游客星球!`. Returning to A gave `Hi, 小明!`, to B gave `Hi, Milo!`, and back to Guest gave `Hi, 游客星球!` — all three values remained distinct. |
| 4 | Unicode and validation | **PASS** | Accepted and survived reload: `李 小明` → `Hi, 李 小明!`; `Anne-Marie` → `Hi, Anne-Marie!`; `O'Neil` → `Hi, O'Neil!`; `  Leo   Mini  ` → `Hi, Leo Mini!` (leading/trailing trimmed, repeated spaces collapsed). Rejected with the visible message `Use 2–16 letters (Chinese and other scripts OK), numbers, spaces, - or '.` and no storage change: `A` (too short), `abcdefghijklmnopq` (too long), `<>@#` (symbols only). |
| 5 | HTML/XSS safety | **PASS** | Submitting `<script>alert(1)</script>` through the settings UI produced the same red validation error, left the previously saved nickname unchanged, incremented the `alert` counter 0 times, and created no injected `<img>`/element. The payload was displayed as plain text inside the input only. |
| 6 | Clear / reset behavior | **PASS** | Clearing A's nickname via the UI changed the greeting to A's account name; after reload it was still the account name and A's nickname key was `null`. B's nickname (`Baseline`) was unchanged. |
| — | Browser page errors | **PASS** | 0 uncaught page errors during the whole run. |

No case was **FAIL** or **Blocked**, so there are no reproduction steps or severities for failures. Reproducible steps for each passing case are below.

## 4. Reproducible steps

Precondition: open the production URL in the browser; use the disposable accounts A and B created via **Create account** in the top-bar account dialog; use **Log out** in the account popover for Guest/signing out; open **Settings** (🎨 button) → **Name** field → **Save** for nickname operations.

1. **Persistence:** sign in as A → set `小明` → read greeting → reload → read greeting again.
2. **Isolation:** sign in as B (no nickname yet) → read greeting → set `Milo` → sign out → sign in as A → read greeting → sign out → sign in as B → read greeting.
3. **Guest:** sign out → set `游客星球` → sign in as A → read greeting → sign out → sign in as B → read greeting → sign out → read greeting.
4. **Validation:** sign in as B → save each accepted value in turn and record greeting before/after reload; then save each rejected value and record the error text plus whether the stored nickname changed.
5. **XSS:** on B (nickname `Baseline`), override `window.alert` with a counter, submit `<script>alert(1)</script>` in the Name field, then check the error element, the stored nickname, the counter, and the DOM.
6. **Clear:** on A, set `小明`, then empty the Name field and Save → read greeting → reload → read greeting → inspect the stored key → sign in as B and confirm its nickname is intact.

## 5. Screenshots

All six screenshots are in `test-reports/test002/` in this report branch. The account chip/bar were hidden at capture time; only synthetic nicknames are visible.

- `test002-1-persistence.png` — A's `小明` greeting after reload.
- `test002-2-isolation.png` — B showing `Milo` after switching back from A.
- `test002-3-guest.png` — Guest showing `游客星球`.
- `test002-4-validation.png` — validation error for rejected input.
- `test002-5-xss.png` — `<script>alert(1)</script>` displayed as plain text with a validation error; no execution.
- `test002-6-clear.png` — greeting after clearing A's nickname.

## 6. Evidence notes and limitations

- These tests were performed **directly on production** with a real browser, not simulated locally. The earlier TEST-001 browser check used injected `localStorage` state and is **not** evidence for this acceptance test.
- Nicknames are device-local by design (not cloud-synced), so isolation was verified within one browser/device profile across account switches, which is the behavior under test.
- Account creation/login succeeded during the test window; had it failed, the run would have stopped with a Blocked result rather than substituting fake account state.
- Two disposable synthetic accounts remain on production intentionally; no deletion was performed. No real child data was used or altered.

**Production acceptance: PASS.**
