# BlockQuest Classroom — Improvement Plan

**Reviewed:** 2026-09-24 · **Scope:** `main` @ `315d03d` · **Lens:** a 5-year-old on a tablet
**Read:** README.md, IMPROVEMENT_PLAN.md, index.html (~6,000 lines / 440 KB), `js/` (data-layer, skill-engine, blipola-runtime), `shared/`, `data/` (schema-level), `supabase/` (README, schema, 6 migrations), `sw.js`, `manifest.json`, both GitHub workflows. **Not read exhaustively:** per-word vocab entries; `images/`/`icons/` binaries (sizes noted).

## Open GitHub issues / PRs (context)

| # | Type | Title | Status |
|---|---|---|---|
| #1 | PR (open since 2026-09-06) | P0: PWA offline reliability + content validation tooling | Unmerged. Proposes dynamic runtime image caching in `sw.js`, shared `APP_VERSION`, hidden debug panel (`?debug=1`), `tools/validate_content.py`. |
| #2 | PR (open since 2026-09-06) | P1: Mastery tiers, Review Due, Daily Adventure, Parent Dashboard | Unmerged, branches from #1's branch. jsdom-verified only; author recommends manual device testing. |
| #34 | Issue | Add semantic Grade 1 Math interactions (data-bar selection, place-value tens/ones feedback; restrict number-line/count/compare to suitable prompts) | Open task. Effectively blocked by P0-1 below. |

## Cross-reference: existing `IMPROVEMENT_PLAN.md`

- It's **stale**: mapped to `main` @ `fe978dd`, describing a 1,407-line `index.html`. The repo has since gained the Blipola runtime, Supabase accounts, grade pages, `data/` banks, and CI. Its "Open questions" reference `sync_claude_branch.sh` / a native Android app that don't exist in the repo.
- Its "ALL COMPLETE ✅" claim for items A–G **checks out on current main** (verified): descriptive praise in `handleChoice()`, audio on trace completion in `renderTrace()`, retry celebration, spaced-repetition `due{}` map + "Today's Review" card (`index.html:2507`, `startReview()` at `:2491`, "Review Complete!" screen at `:3822`), adaptive weighting (`:2934`), free-play screen (`renderFreeplay()`, `:5634`), parent JSON export (`exportProgress()`, `:4233`).
- **Overlap warning:** PRs #1/#2 re-implement adjacent ideas (Review Due tile, Daily Adventure, Parent Dashboard) that the old plan partially covers. Merging #2 without reconciling will create duplicate review/daily features. Recommend: merge #1/#2, then reconcile old-plan items B/D/G against the new implementations (keep one of each).

## P0 — Critical (fix now)

**P0-1. `data/grade-1/math.js` is truncated — syntax error on `main`, Grade 1 Math interactive content silently missing.**
The file is 51 lines and ends mid-function (`Unexpected end of input`; confirmed identical on remote, so it's committed broken, not a clone artifact). The `<script src>` fails to parse → `window.KC_G1_MATH` never set → `index.html:4952` (`GRADE1_INTERACTIVE.math = window.KC_G1_MATH`) assigns `undefined` → Grade 1 Math course falls into the "CURRICULUM IN PROGRESS" placeholder branch. An entire subject's authored content is invisibly absent. Worse, the file's builder references the main-script const `GRADE1_INTERACTIVE` at data-file parse time (before the main script runs) — it would throw `ReferenceError` even with the brace fixed. *Fix:* restore the complete file, make it self-contained (inline unit names, no main-script dependency). *Effort:* S. *Why it shipped:* `validate.yml` only syntax-checks `blipola-runtime.js` + inline script (see P1-9).

**P0-2. `sw.js` precaches `js/blipola-voice.js`, which doesn't exist → service worker install fails.**
`sw.js:8` lists `./js/blipola-voice.js` in `APP_SHELL`; the file isn't in the repo. `cache.addAll()` is atomic — one 404 rejects the whole install, so `kc-shell-v12` never activates and users stay on a stale worker. Offline PWA is broken at the install step. *Fix:* delete the line (the voice button at `index.html:751` uses `blipolaVoiceAction()` from `blipola-runtime.js`, so nothing needs the file). *Effort:* XS.

**P0-3. Unguarded Supabase CDN load can kill the entire app.**
`index.html:756` loads `supabase-js` from jsDelivr; `:1882` runs `const supa = supabase.createClient(...)` unconditionally at the top level of the main script. If the CDN is unreachable (offline, ad-blocker, jsDelivr outage), `supabase` is undefined → `ReferenceError` → the whole ~6,000-line script halts → blank app. *Fix:* `const supa = window.supabase ? supabase.createClient(...) : null` and null-guard uses. *Effort:* S.

**P0-4. Merge (or close) PRs #1 and #2 before they bit-rot.**
#1 fixes real offline gaps (only ~30 of 268 images precached today; everything else 404s offline with an uncaught fetch rejection) and adds the content validator that would have caught P0-1. #2 adds the headline learning features. Both open since Sept 6; #2 branches from #1. *Effort:* M (review + merge + the manual device testing both PRs still need).

## P1 — High value

**P1-5. The normalized Supabase sync layer is dead code — wire it up or delete it.**
`ensureNormalizedAuth()` (`index.html:1943`) bails on `!window.supa`, but nothing ever assigns `window.supa` — so `KCData.flushNormalized / fetchNormalizedProgress / fetchRecentActivity / fetchSkillActivity` always return "not linked." Six migrations built `players / player_progress / activity_events / daily_goals`, but the normalized tables are never written. (Name+PIN login itself works — `cloudLogin` uses the `supa` const directly.) *Fix:* decide — either assign `window.supa = supa` and test the anonymous-auth + `claim_player_auth` flow end-to-end, or remove the dead layer and migrations' client expectations. *Effort:* M. *Note:* #2's Parent Dashboard reads these endpoints, so this blocks #2's value.

**P1-6. Grade 2 banks: 5 unique questions repeated 6×, with filler hints.**
`data/grade-2/core.js` builds 30 "lessons" per unit by cycling 5 defs (`d[1][n % d[1].length]`); every hint is "Use the clues and think about the skill in this unit." and every explanation is "The correct answer is X." The course footer claims "30+ practice questions" per unit. A 5-year-old will see repeats within one sitting. *Fix:* author ~25–30 unique questions/unit with real hints, or correct the claim. *Effort:* L (content) / S (claim fix).

**P1-7. 1.2 MB of dead images ship to every user.**
`images/words/` (170 PNGs, 1.2 MB) is unreferenced — vocab migrated to emoji (`VOCAB_LEVELS` entries carry `emoji`, not `img`; rendering falls back to emoji at `index.html:2475`), yet `sw.js` still precaches 30 of the PNGs. Also 2 orphan webp files (`download_imag`, `download_via_a`). *Fix:* delete `images/words/`, drop from `sw.js`, remove orphans. *Effort:* S.

**P1-8. README "Adding New Words" documents a workflow the code no longer uses.**
It instructs downloading BlockQuest sprites into `images/words/` and adding an `img` field — the code ignores `img` for vocab. A parent/dev following it gets silently ignored work. *Fix:* rewrite for the emoji-entry format (or decide sprites return). *Effort:* S. (Same class: `manifest.json` description advertises "colors, shapes, animals" — no such categories exist.)

**P1-9. CI doesn't check most of the JavaScript.**
`validate.yml` checks `js/blipola-runtime.js` + the inline script only — not `data-layer.js`, `skill-engine.js`, `grade-page.js`, or any `data/*.js`. That's how P0-1 shipped. *Fix:* `node --check` every JS file; adopt `tools/validate_content.py` from PR #1. *Effort:* S.

**P1-10. Confirm server-side login throttling.**
The publishable key is committed to the public repo (by design for Supabase; probed anonymously — direct `players` SELECT is correctly denied 42501, so RLS holds). But login rate-limiting exists only as in-memory client state (`LOGIN_MAX_ATTEMPTS`, `index.html`); migration `005_login_throttling.sql` suggests a server control — verify it's real and effective, and confirm `create_player`/`login_player`/`get_player_salt` can't be abused beyond the intended name+PIN flow. PBKDF2-120k PIN verifier design is sound. *Effort:* S (review, not code).

**P1-11. Issue #34 (Grade 1 math interactions).** Data-bar selection + tens/ones place-value feedback; scope number-line/count/compare interactions to fitting prompts. Do after P0-1 (the bank it refines is currently broken). *Effort:* M.

## P2 — Nice to have

- **P2-12. Decompose the 440 KB monolith.** `index.html` is one ~6,000-line script; extracting config/renderers into `js/` modules (as started with `data-layer.js`/`skill-engine.js`) would make review and testing feasible. *Effort:* L, incremental.
- **P2-13. Grades 3–8 are gated ("BUILDING") but the footer claims "Pre-K through Grade 8 curriculum is organized here."** Either hide unfinished grades from home or soften the claim. *Effort:* S.
- **P2-14. Progress-schema sprawl.** Three parallel systems: `mastery` counters, `due{}` map, `progress.__blipola` (+ the `KCData` queue). Document the canonical schema; converge over time. *Effort:* M.
- **P2-15. Grade pages use iframes** (`pre-k/`, `kindergarten/`, `grade-1/`, `grade-2/` embed `index.html?grade=X&pageShell=1` in a fixed `calc(100vh - 100px)` frame). Nested scrolling and iframe TTS/autoplay quirks on tablets; consider plain links. *Effort:* M.
- **P2-16. Timed mode vs. no-pressure ethos.** `kc_timed_best` countdown exists while PR #2 deliberately avoided streak pressure — decide if timed challenge fits a 5-year-old; consider gating behind a parent setting. *Effort:* S (decision).
- **P2-17. Refresh `IMPROVEMENT_PLAN.md`** to the current architecture; archive the `fe978dd`-era status block. *Effort:* S.

## Quick wins (smallest first)

1. Remove `./js/blipola-voice.js` from `sw.js` precache — 1 line, unbreaks SW install (P0-2).
2. Null-guard `supabase.createClient` — ~5 lines, app survives CDN failure (P0-3).
3. Extend `validate.yml` to `node --check` all JS files — prevents the next P0-1 (P1-9).
4. Delete `images/words/` + orphan webp; drop from `sw.js` — saves 1.2 MB (P1-7).
5. Restore + decouple `data/grade-1/math.js` — restores Grade 1 Math (P0-1).
6. Rewrite README "Adding New Words" + fix `manifest.json` description (P1-8).

## What's solid (don't "fix")

TTS layer (`playBrowserUtterance`/`getBestVoice`: feature-detects, handles `voiceschanged`, resolves on error — no hangs), trace-canvas touch handling (`touch-action: none`, tap-highlight removed), emoji `onerror` fallbacks on images, account-name XSS escaping (`esc()` at render), PBKDF2 PIN-verifier flow (never sends/stores raw PIN), offline-first localStorage with async cloud sync that never blocks lessons, and the PWA install/update plumbing (`skipWaiting`, cache versioning, network-first navigations).

**Suggested order:** P0-2 + P0-3 + P1-9 (one small PR, unbreaks offline/CI) → P0-1 (restore Grade 1 math) → P0-4 (merge #1, then #2, reconciling review/daily features with old-plan B/D/G) → P1-5 (decide normalized sync fate — gates #2's dashboard value) → P1-6/P1-11 (content) → P2 as appetite allows.
