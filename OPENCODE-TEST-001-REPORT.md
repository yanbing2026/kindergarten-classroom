# OPENCODE-TEST-001 — Nickname System Improvement Report

Branch: `test/opencode-collaboration-01` (created from `origin/main`)
Pull Request: https://github.com/yanbing2026/kindergarten-classroom/pull/74

## Files modified

| File | Change |
| --- | --- |
| `index.html` | Replaced the device-wide nickname implementation with per-account, Unicode-safe helpers; updated settings copy/placeholder and `maxlength`; clear a deleted account's nickname; bumped `APP_VERSION`. |
| `sw.js` | Bumped `APP_VERSION` (and its comment) to match `index.html`. Required by repository rules because the precached HTML changed. `APP_SHELL` contents were **not** changed. |
| `scripts/test_nickname_system.js` | **New.** Behavioral test suite that extracts the real helpers from `index.html` and runs them against an in-memory `localStorage`. |
| `OPENCODE-TEST-001-REPORT.md` | This report. |

No database schema, Supabase, Cloudflare backend, service-worker caching logic, or theme/UI code outside the nickname settings was changed. Nothing was merged or deployed.

## Implementation summary

The old implementation kept one `kc_nickname_v1` value for the whole device and validated it with `/^[a-zA-Z0-9 '-]{2,16}$/`, which rejected Chinese and most non-Latin names.

New helpers in `index.html`:

- `nicknameNamespace(accountKey)` / `nicknameStorageKey(accountKey)` — map an account key to a namespaced storage key.
- `normalizeNickname(raw)` — Unicode **NFC** normalization, trim, collapse repeated ASCII spaces.
- `isValidNickname(value)` — 2–16 **code points** (via `Array.from`, so astral letters count as one); only Unicode letters (`\p{L}`), marks (`\p{M}`), numbers (`\p{N}`), spaces, `-`, `'` and `’`; requires at least one letter or number, so empty/whitespace/punctuation-only names are rejected.
- `getNickname()` / `setNickname(name)` — read/write the current namespace, re-validating on read so tampered or malformed storage can never surface; both consume the legacy key as described below.
- `saveNickname()` — uses the same normalizer/validator; shows the existing error element on invalid input and no longer closes the modal on failure.
- `renderHome()` still builds the greeting with `esc(nickname)`; the settings input still uses `esc(...)` plus explicit quote escaping. No unsafe HTML rendering was introduced.

The settings error text now reads "Use 2–16 letters (Chinese and other scripts OK), numbers, spaces, - or '."; the placeholder is `e.g. Leo / 小明`; the help text states that the name is saved separately for each child. The input `maxlength` is 32 UTF-16 units so that 16 supplementary-plane letters (surrogate pairs) can be typed — the authoritative 16-code-point limit is enforced in `isValidNickname()`.

## Account identification strategy

The stable local identifier is `kc_current_account`, i.e. `getCurrentAccount()`. Its value is the **lowercase account name key** created by `cacheAccount()` (`name.toLowerCase()`), which is also the key used by `kc_accounts_v1` and by `accountProgressKey()` for per-account progress. It is preferred over the display name (which is case-variable) and over a cloud player ID (which is not available synchronously and would break offline-first reads).

Storage layout:

| Context | Key |
| --- | --- |
| Child account `Alice` | `kc_nickname_v1_acct_alice` |
| Child account `Bob` | `kc_nickname_v1_acct_bob` |
| Guest / signed-out (default) | `kc_nickname_v1_guest` |

Because `getNickname()` reads only the current namespace, switching accounts can never display another child's nickname; `renderHome()` falls back to the account's display name when that account has no nickname. Account deletion (`submitAccountSecurity('delete')`) now also removes `nicknameStorageKey(key)`.

## Migration strategy

`kc_nickname_v1` was device-wide and recorded **no account association**, so it is impossible to know which child (if any) wrote it. Assigning it to whichever account happens to be signed in at upgrade time could therefore give one child another child's nickname.

The implemented policy:

1. **Named accounts never read or inherit the legacy key.** `getNickname()` returns `''` (no nickname) for a signed-in account whose own key is unset.
2. **Guest namespace only.** When signed out, if the guest key is unset and the legacy key exists, a valid legacy value is NFC-normalized, validated, copied to `kc_nickname_v1_guest`, and the legacy key is removed. This is idempotent.
3. **Invalid legacy data is discarded.** Values failing the new validator (including HTML/JS injection payloads) are not copied; the legacy key is still removed so it cannot resurface later.
4. **Any save or clear consumes the legacy key**, so a stale device-wide value cannot appear later under a different account.
5. The legacy key is read by a named account only to be ignored — it is deliberately *not* consumed on an account read, so a later guest read can still migrate it.

This avoids silent misattribution; the trade-off is documented under Known limitations.

## Tests executed and actual results

All commands were run locally on `test/opencode-collaboration-01` with Node v22.23.5. No test was skipped.

| Command | Actual result |
| --- | --- |
| `python3 tools/validate_content.py` | **PASS** — "PASSED: No content issues detected" (including G1/G2 depth checks). |
| `node --check sw.js` | **PASS** (no output). |
| `node --check scripts/test_nickname_system.js` | **PASS** (no output). |
| `node scripts/test_nickname_system.js` (new) | **PASS** — all 12 assertions groups printed ✓ and "All nickname system tests PASSED! ✅". |
| `for t in scripts/test_*.js; do node "$t"; done` | **PASS — 24/24 scripts**, including all pre-existing suites and the new one. |

New suite coverage (each group executed and passed):

- Chinese nickname save/reload (`小星星`).
- English nickname save/reload and NFC normalization (`e\u0301e\u0301` → `éé`).
- Switching between two child accounts (Alice/Bob), including case-insensitive account key stability.
- Clearing a nickname.
- Invalid input: empty, whitespace-only, 1 char, 17 chars, punctuation-only, control characters, zero-width space, emoji.
- Valid edge cases: Chinese, accented Latin, spaces, hyphen, apostrophe, exactly 16 code points, supplementary-plane letters.
- HTML injection attempts (`<script>…`, `"><img onerror=…>`, `<b>`, `&#60;script&#62;`) rejected on write and on read, plus a tampered-`localStorage` case; `renderHome()` still escapes the nickname.
- Legacy migration: valid value → guest once and key consumed; named child never inherits it; invalid values discarded.
- Guest namespace isolation across account switches.
- The real UI `saveNickname()` path: saves valid input, shows an error for injection, clears on empty input.
- Account deletion also removes the nickname key.

## Known limitations

- A legacy nickname that actually belonged to a signed-in child is **intentionally not preserved for that child**; it migrates to the guest namespace and that child must save a name again. This is the cost of never guessing an owner for an unattributed device-wide value.
- The guest namespace is shared by all signed-out use on the device; the app has no guest identity beyond "signed out".
- The settings input `maxlength="32"` (UTF-16 units) is looser than the true 16-code-point rule; very long ASCII input can be typed but will be rejected on Save with an error message.
- Nicknames remain local to the device only — they are not synced to the cloud, matching the previous behavior. Existing per-account storage keys are not namespaced by anything beyond the lowercase account name, which is unique case-insensitively.
- `sw.js` was modified only to bump `APP_VERSION`/`CACHE_NAME`; no caching behavior changed. Deployed installs will pick up the new HTML on the next activation, as with any version bump.

## Git commit SHA

Implementation + tests: `18eceea0a7491359768985996bb01dd81a55d2ee` (`18eceea`)
Report: added in the documentation-only commit on this branch that immediately follows it (see `git log -2`).

## Pull Request URL

https://github.com/yanbing2026/kindergarten-classroom/pull/74

> No merge or deployment was performed. Awaiting independent ChatGPT review.
