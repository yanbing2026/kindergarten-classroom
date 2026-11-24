# OPENCODE-TEST-006 — Learning Journey & Curriculum Content Regression Report

**Result: 2 PASS / 1 FAIL / 0 BLOCKED / several NOT TESTED (see §3).** The one FAIL is a persistence defect: an immediate sign-out after answering loses the most recent reward(s). No content-correctness defect was confirmed.

Issue: https://github.com/yanbing2026/kindergarten-classroom/issues/84

## 1. Environment

| Item | Value |
| --- | --- |
| Production URL | https://blockquest-classroom.pages.dev/ |
| UTC test window (main run) | `2026-11-22T02:41:18Z` → `2026-11-22T02:41:38Z` |
| Focused defect reproduction (UTC) | approximately `2026-11-22T02:45Z`–`02:48Z` |
| Browser | Google Chrome `157.0.8103.38`, headless, driven by `puppeteer-core` |
| Viewport / device | `1280×900` **headless desktop** — no mobile emulation, no real device |
| Account | existing **synthetic disposable account A** (from TEST-002…005) only; no real user data accessed |

## 2. Coverage matrix

| Grade/level | Subject | Activities exercised | Items checked | Outcome |
| --- | --- | --- | ---: | --- |
| Pre-K L1 | Letters & Phonics | Learn grid + Play quiz | 4 (3 Learn cards + 1 quiz question) | PASS — content consistent |
| Kindergarten L1 | Math (legacy math quiz) | Play quiz | 3 (1 correct, 1 wrong, 1 retry/correct) | PASS — arithmetic correct |
| Grade 1 Unit 1 | Mathematics | Full grade lesson unit (4 questions) + wrong-answer attempt | 5 | PASS — arithmetic and feedback correct; wrong-answer selector could not be targeted (see NOT TESTED) |
| Grade 1 Unit 2 | Mathematics | Grade lesson | 1 | PASS — comparison correct; answer button not found via selector (content still captured) |
| Grade 2 Unit 1 | Science | Grade lesson (correct + wrong) | 2 | PASS — claims correct, wrong-answer feedback appropriate |
| Grade 2 Unit 2 | Science | Grade lesson | 1 | PASS — claim correct |
| Daily START | Letters (chosen by product) | Today adventure quiz | 1 | PASS — cat emoji → C ("cat") |
| **Total** | **5 distinct combos** | **2 activities where available** | **17 items** | 16 content items consistent; 1 persistence FAIL |

Inventory observed from the UI: 4 playable grades (Pre-K, Kindergarten, Grade 1, Grade 2), each exposing 5 courses; Grades 3–8 are displayed as `BUILDING` only and were therefore not tested for content. Free Play exposes 6 filters and 28 cards. No empty, duplicated or mislabeled curriculum entry was encountered in the sampled paths.

## 3. Check results

| Check | Result | Expected vs observed |
| --- | --- | --- |
| Curriculum inventory | **PASS** | Recorded all grade/course entries actually exposed; Grades 3–8 correctly reported as unavailable. |
| Content correctness (17 items) | **PASS** | Every sampled prompt, choices, expected answer and feedback were internally consistent; see §4. |
| Rendering smoke on 6 screens | **PASS** | No horizontal overflow, no broken local images, no replacement characters, no clipping of key controls. |
| Learning flow | **PASS** | Entry → answer → feedback → next question → unit completion worked. Grade 1 Mathematics Unit 1 was completed: `Unit Complete! 4/4 first-try correct, +4 diamonds`. Wrong answers in Kindergarten Math and Grade 2 Science produced retry feedback and allowed a correct retry. |
| Navigation smoke | **PASS** | Grade tabs, course selection, in-app Home and returning to a lesson all worked. |
| Error/network | **PASS** | 0 page errors, 0 console errors, 0 failed requests, 0 HTTP ≥400. |
| **Progress persistence across immediate sign-out** | **FAIL** | See §5 — diamonds decreased on re-login. |
| Wrong-answer feedback for Grade 1 numberline question | **NOT TESTED** | The wrong answer button was not found by the automation selector; the question content and correct answer were still recorded. |
| Answer-button tap for Grade 1 Unit 2 item | **NOT TESTED** | Same numberline-selector limitation; item content recorded. |
| Keyboard focus / labels / contrast | **NOT TESTED** | Only visual rendering was checked; no systematic keyboard or contrast audit was performed. |
| Grades 3–8 content, full curriculum, other subjects/units | **NOT TESTED** | Not exposed as playable, or out of sample scope. |
| Physical device / emulated mobile / screen reader | **NOT TESTED** | Desktop headless Chrome only. |
| BLOCKED | **0** | No test required destructive setup or another account. |

## 4. Content correctness evidence

All answers below were derived from the question text or arithmetic and cross-checked with the app's expected answer (`correctId` / `answer`); none were guessed.

- **Pre-K / Letters L1** — Learn cards `A` (Apple), `B` (Ball), `C` displayed correctly with a mastered check on A/B; quiz `Find the letter H` with choices H/J/G/K → **H** consistent.
- **Kindergarten / Math L1** — `2+?=4` (choices 4/3/2/1) → **2** (2+2=4, independently verified); `Which number is less? 10 vs 7` (choices 6/7/10/8) → **7**, wrong selection 6 produced a retry and correct selection 7 proceeded.
- **Grade 1 / Mathematics Unit 1** — `What is 9 − 1?` → **8**; `What is 13 + 7?` → **20**; `What is 17 − 1?` → **16**; `What is 4 + 12?` → **16**. All independently computed; feedback explanations (`9 minus 1 equals 8.`, etc.) matched. Unit end reported `4/4 first-try correct`.
- **Grade 1 / Mathematics Unit 2** — `Which number is greater: 34 or 28?` → **34**, correct.
- **Grade 2 / Science Unit 1** — `A puddle on the sidewalk is gone by the afternoon. What happened to the water?` → **It evaporated into the air**, explanation about sunlight/water vapor is accurate for this level. `Which material is best for a raincoat?` → **plastic**, distractors paper towel/cotton balls/tissue paper; wrong choice produced `Try again. Raincoats must keep water out.`
- **Grade 2 / Science Unit 2** — `What do herbivores eat?` → **plants**, with an example (rabbits eating grass); correct.
- **Daily START** — `Which letter does this start with? 🐱` with choices C/S/Q/X → **C** ("cat"); relationship holds.

No spelling/grammar error, broken symbol, missing asset or mislabeled item was observed in the sampled screens.

**Subjective improvement suggestions (not defects):** some science distractors are obviously implausible for grade 2 (e.g. `It sank into outer space`, `It turned to rock`), which lowers the challenge but does not make the item incorrect. The internal math question metadata for the comparison item reported `op: "add"` while the displayed prompt was a "less than" comparison; this was not user-visible and is not counted as a defect.

## 5. FAIL — persistence defect

| Field | Detail |
| --- | --- |
| Category | **Persistence** |
| Severity | **Medium** — silent loss of the most recently earned diamonds when the user signs out immediately after answering; in-app use and refresh are unaffected. |
| Expected | Diamonds earned from a correct answer remain after logging out and logging back in. |
| Observed | After a correct answer and immediate sign-out, re-login showed the pre-answer value. Main run: `12 → 22` during testing, `22` after refresh, **`20` after sign-out/in** (2 diamonds lost). Focused reproduction: `20 → 21` after one correct answer, **`20` after sign-out/in** (1 diamond lost), repeated twice with identical result. |
| Screenshots | `test006-17-final.png` (main run after re-login: 20); `repro-1-before-logout.png` (21 before logout), `repro-1-after-relogin.png` (20 after re-login), `repro-2-before-logout.png`, `repro-2-after-relogin.png`. |
| Reproduction | 1. Sign in as A. 2. Tap START, answer one question correctly; observe diamonds increment (e.g. 20 → 21). 3. Immediately open the account popover and tap **Log out** (no wait). 4. Sign in again through the normal UI. 5. Observe diamonds reverted to 20. |
| Supporting note (not a fix) | Reading the app source (without changing it): cloud saves are debounced in `saveProgress()`, and the login path adopts the cloud progress wholesale when no account was selected at login time. An immediate logout can therefore replace newer local progress with an older cloud copy. This explanation was not independently proven beyond the observed behaviour. |

Per the task rules, the affected path was stopped after reproduction; no fix was attempted.

## 6. Progress changes made to synthetic account A

| Phase | Diamonds | Notes |
| --- | ---: | --- |
| Start of TEST-006 | 12 | inherited from earlier test tasks |
| After main content run | 22 | normal learning interactions across 17 items |
| After refresh | 22 | unchanged |
| After sign-out/in (main run) | 20 | **2 diamonds lost** (defect §5) |
| Repro round 1: answer → logout → login | 20 → 21 → 20 | 1 diamond lost |
| Repro round 2: answer → logout → login | 20 → 21 → 20 | 1 diamond lost |
| Final state | 20 | no resets, deletions or overwrites performed by the tester |

Only account A was used. No real user data was accessed; no other account was touched; no destructive cleanup was performed.

## 7. Error/network summary

Clean main run: **0 page errors, 0 console errors, 0 failed requests, 0 HTTP ≥400 responses**. No stuck loading state, blank screen or duplicated UI was observed; the final screen was the home view with one top bar.

## 8. Screenshot index

All files are committed under `test-reports/test006/` and contain only synthetic account UI:

`test006-01-inventory.png`, `test006-02-prek-learn.png`, `test006-03-prek-learn-display.png`, `test006-04-prek-quiz.png`, `test006-05-kg-math-q1.png`, `test006-06-kg-math-wrong.png`, `test006-07-kg-math-correct.png`, `test006-08-g1-math-q1.png`, `test006-09-g1-math-wrong.png`, `test006-10-g1-math-correct.png`, `test006-11-g1-unit-complete.png`, `test006-12-g2-science-q1.png`, `test006-13-g2-science-correct.png`, `test006-14-g2-science-wrong.png`, `test006-15-start-quiz.png`, `test006-16-start-correct.png`, `test006-17-final.png`, `repro-1-before-logout.png`, `repro-1-after-relogin.png`, `repro-2-before-logout.png`, `repro-2-after-relogin.png`.

## 9. Limitations

This was a **browser-based desktop-headless** test. It did not cover a physical device, mobile emulation, screen readers, keyboard-only operation, contrast auditing, Grades 3–8 (shown as BUILDING), all curriculum content, full completion of every activity, or every wrong-answer interaction. Reward accounting was only checked for unexpected side effects; the detailed accounting is covered by TEST-005. Earlier draft scripts had selector/scope bugs; only the final clean run and the focused reproduction are reported as evidence above. No application, backend, schema, content, configuration or deployment change was made; the report-only PR is open and unmerged.
