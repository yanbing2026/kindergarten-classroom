# Classroom App — Engagement Improvement Plan

> Mapped to `main` @ `fe978dd` (Minecraft-themed vocab app, 1407-line `index.html`,
> with `letters`, `numbers`, `words` (English), `chinese`, `spanish`, `math`,
> `trace` categories; leveled vocab; mastery tracking; diamonds/trophies).

## Research base (evidence, not opinion)

| Principle | Source | Implication for this app |
|---|---|---|
| **Descriptive, immediate feedback** beats generic praise ("Good job!") | Gamefik E.N.G.A.G.E. method; Hirsh-Pasek et al. 2015 | Replace generic `PRAISE`/`RETRY` with item-specific confirmations |
| **Spaced repetition + retrieval practice** strengthens memory | Krath 2021 (g≈0.36); cognitive-science consensus | Items mastered once are never re-scheduled for review → add interval review |
| **Autonomy & choice** drives intrinsic motivation (SDT) | Prensky / m-learning preschool studies (doi:10.3390/educsci11050229) | Already strong (level + category select); add a no-pressure free-play mode |
| **Scaffolded, adaptive difficulty** | Mayer's Cognitive Theory of Multimedia Learning | Math ramps by `solved` count; vocab/letters/numbers do **not** adapt |
| **Gamification works but can backfire** if rewards crowd out intrinsic drive | Tayumira gamification review (motivational g=0.36) | Keep diamonds light; celebrate *effort* (retry success), not only first-try |
| **Multisensory + motor engagement** | Springer literacy-apps synthesis (2026, ages 0–8) | `trace` mode exists (good); add audio confirmation on stroke finish |

---

## Improvements (prioritized)

### Tier 1 — Quick wins (no data-model change)

**A. Descriptive praise**  *(evidence #1)*
- File: `index.html` → `PRAISE` / `RETRY` arrays + `handleChoice()`
- Replace generic strings with item-aware confirmations. Pass the item's
  spoken label into the success path:
  - English: `"Yes! 🪓 is Axe!"`
  - Chinese: speak hanzi + en (`"苹果 — Apple!"`)
  - Spanish: `"¡Sí! Manzana es Apple!"`)
  - Math: `"Correct! 3 plus 2 is 5!"` (already known via `q.a`/`q.b`/`q.sum`)
- `RETRY` becomes constructive + hints at the answer, not just "try again".

**E. Audio on trace completion**  *(evidence #6)*
- File: `index.html` → `renderTrace()` / trace stroke handlers
- When a word's tracing finishes (or per-stroke), call `speak(word.en)` (or
  `speakBilingual` for zh/es). Reuses existing `speak`/`speakBilingual` bridge.

**F. Effort-based celebration**  *(evidence #5)*
- File: `index.html` → `handleChoice()`
- Currently confetti + praise only fire on **first-try** correct. Add a softer
  celebration when a *retry* is eventually correct, so persistence is rewarded
  (reinforces growth mindset, avoids reward-only motivation).

### Tier 2 — Substantive learning-science upgrades (small schema bump)

**B. Spaced-review scheduler**  *(evidence #2)*
- Change `progress.mastery[cat][id]` from a counter →
  `{ count, lastCorrect: timestamp, nextDue: timestamp }`.
- On correct answer: `count++`; set `nextDue = now + interval(count)`
  (1d → 3d → 7d → 14d).
- `buildQuestion()` for any category: with probability `p`, pick an item
  whose `nextDue <= now` (due review) before pulling a fresh/weak item.
- Backward-compatible migration in `loadProgress()` (old number →
  `{count:n, lastCorrect:0, nextDue:0}`).

**C. Adaptive vocab weighting**  *(evidence #4)*
- File: `index.html` → `pickChoices()` / `buildQuestion()`
- Within a level, weight item selection by mastery: unsolved / low-`count`
  items get higher probability; already-mastered (past `nextDue` review)
  get down-weighted but not dropped. Math already self-adapts via `range`
  by `solved`; extend the same idea to vocab/letters/numbers.

### Tier 3 — New features

**D. Free-play / sandbox mode**  *(evidence #3)*
- New `screen: 'freeplay'` + home-card entry.
- Tap any item (letter, vocab card, number, shape) → hear it, see a big visual,
  no quiz, no wrong-answer state. Pure exploration; great for a 5-yo on the TV
  with a parent. Reuses `learnTap()` rendering minus the mastery check.

**G. Parent dashboard export**  *(practical)*
- File: `index.html` → `renderProgress()`
- Add an "Export progress" button that downloads `progress` as JSON
  (`kc_progress_export_<date>.json`) so you can see exactly what he's mastered
  and where he's stuck. No server needed.

---

## Build status — ALL COMPLETE ✅

Implemented step-by-step on `main`, each committed and pushed to GitHub:

| Step | Improvements | Commit | Status |
|---|---|---|---|
| 1 | **A** descriptive praise, **E** audio-on-trace, **F** retry celebration | `d1b4f0b` | ✅ |
| 2 | **B** spaced-repetition scheduler (due map + home nudge) | `902fa87` | ✅ |
| 3 | **C** adaptive vocab weighting (builds on B) | `d65f1eb` | ✅ |
| 4 | **D** free-play sandbox mode | `0b415a6` | ✅ |
| 5 | **G** parent progress export (JSON download) | `65db79d` | ✅ |

> Note: B kept `mastery[cat][id]` as a backward-compatible counter and added a
> parallel `due[cat][id]` timestamp map (rather than the `{count,nextDue}`
> object proposed in the plan) — same behavior, simpler migration, and the
> native app's offline `classroom.html` picks it up unchanged after a sync.

## Suggested build order (as executed)
1. **A + E + F** — polish, no schema risk. ✅
2. **B** — spaced repetition (biggest learning win); migration guard added. ✅
3. **C** — adaptive weighting (build on B's mastery object). ✅
4. **D + G** — new screens, independent of B/C. ✅

## Open questions for the parent (Gary) — still your call
- Spaced review *runs alongside* the normal 8-question round (it prioritizes
  due items automatically); a dedicated "Review due" button was not added. Want one?
- Free-play uses the full vocab set (letters/numbers/words/chinese/spanish). ✅
- Parent export = local file download (no upload). ✅
- **Next:** sync the native Android app (ClassroomApp) so the offline TTS build
  reflects these changes — `sync_claude_branch.sh` repointed to `main` + run.
