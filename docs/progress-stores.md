# Progress Storage Architecture & Audit (`docs/progress-stores.md`)

## 1. Executive Summary

BlockQuest Classroom maintains four progress/data subsystems:
1. **`progress.mastery` / `progress.due`**: Kindergarten item-level spaced-repetition mastery (0..3) and next-review timestamps.
2. **`progress.gradeMastery`**: Grade 1 / Grade 2 interactive unit counters (cumulative first-try correct questions).
3. **`KCData` Normalization Layer**: Relational sync abstraction (`player_progress`, `activity_events`, `daily_goals`) queued locally and flushed to Supabase.
4. **`KCSkillEngine` (`progress.skillStats`)**: Client-side skill evidence graph (Bayesian smoothed mastery, misconception classification, remediation history, transfer checks, adaptive lesson scoring).

**Core Audit Finding**:
- The four stores serve **distinct domain boundaries**:
  - `mastery` is Kindergarten quiz item mastery.
  - `gradeMastery` is Grade 1 & 2 unit interactive lesson completion.
  - `KCData` is an asynchronous cloud sync/event stream layer.
  - `skillStats` is the Grade adaptive tutoring and remediation engine.
- Merging them into a single monolithic store or introducing new schema abstractions is prohibited and would create architectural coupling across different curriculum paradigms.
- However, three concrete consistency/data bugs were identified and fixed:
  1. **Parent Dashboard `s.nextReviewAt` evaluation bug**: `renderParentDashboard()` attempted `Number(s.nextReviewAt)` on an ISO 8601 string (`"2026-..."`), yielding `NaN`. Consequently, skills due for review in `KCSkillEngine` never displayed `'🔄 Review due'` in the local dashboard card, even while the tutor and cloud history recognized them as due.
  2. **`exportProgress()` missing `gradeMastery`**: When exporting parent progress JSON, `gradeMastery` was omitted from the dumped payload despite being active in `progress`.
  3. **`renderProgress()` `NaN%` calculation**: When rendering progress rows for categories without static item banks (such as dynamic Math), `0 / 0` yielded `NaN%`.

---

## 2. Read / Write Matrix for All Four Stores

| Store / Field | Writers (Who Writes) | Readers (Who Reads) | UI / Consumer Surface |
|---|---|---|---|
| **`progress.mastery[cat_level][id]`** | - `bumpMastery(cat, id)` (`index.html:2554`) on correct first attempt in Kindergarten quiz.<br>- `decayMastery(cat, id)` (`index.html:2568`) on wrong first attempt for due items.<br>- `loadProgress()` (`index.html:2181`) legacy key migration.<br>- `cloudLogin` / `cloudCreate` (`index.html:2139, 2156`) via account progress payload. | - `getMasteryCount(cat, id)` (`index.html:2551`)<br>- `categoryMasteredCount()` (`index.html:2590`)<br>- `categoryLearningStats()` (`index.html:2596`)<br>- `categoryMasteredAllLevels()` (`index.html:2622`)<br>- `buildQuestion()` (`index.html:2920`) weighted question selector.<br>- `exportProgress()` (`index.html:4639`) | - **Progress Page**: Skill bar per category (`renderProgress`) & Skill Map (`renderSkillMap`).<br>- **Parent Dashboard**: Mastered % (`pct`), Learning count (`stats.learning`), Review due count (`stats.review`), Focus list (`stats.focus`), Overall progress card.<br>- **World Map**: Stage unlock buildings (`getWorldSkillPercent`).<br>- **Timed Challenge**: Category eligibility filter. |
| **`progress.due[cat_level][id]`** | - `scheduleNextReview(cat, id, count)` (`index.html:2544`) calculates `Date.now() + days * 86400000` on every `bumpMastery` or `decayMastery`.<br>- `loadProgress()` (`index.html:2203`). | - `dueTimestampFor(cat, id)` (`index.html:2536`)<br>- `isDue(cat, id)` (`index.html:2540`)<br>- `categoryDueCount()` (`index.html:2594`)<br>- `categoryLearningStats()` (`index.html:2602`)<br>- `getDueReviewItems()` (`index.html:2830`)<br>- `buildQuestion()` (`index.html:2922`)<br>- `exportProgress()` (`index.html:4644`) | - **Daily Quest**: "Today's Review" card & daily review task completion.<br>- **Parent Dashboard**: Due for review count (`stats.review`).<br>- **Progress Page**: Skill Map review indicator (`🔄 X to review`).<br>- **Kindergarten Quiz**: Weighted sampling prioritization of due items. |
| **`progress.gradeMastery[key]`**<br>*(key: `gradeId_courseIndex_unitIndex`)* | - `handleGradeChoice()` (`index.html:5901`)<br>- `handleGradeSortChoice()` (`index.html:5903`)<br>- `handleGradeNumberSubmit()` (`index.html:5905`)<br>- `handleGradeTextSubmit()` (`index.html:5906`)<br>- `finishInteractiveAnswer()` (`index.html:5869`)<br>- Increments `+1` on `gradeQuiz.firstAttempt` correct answer.<br>- `loadProgress()` (`index.html:2205`). | - `gradeUnitProgress(gradeId, courseIndex, unitIndex)` (`index.html:5509`)<br>- `exportProgress()` (`index.html:4640`) *(fixed)* | - **Grade Course Overview (`renderGradeCourse`)**: Displays `progress.correct + '/' + progress.total + ' first-try correct'` on unit card.<br>- **Parent Export**: Downloadable progress JSON *(now preserved)*. |
| **`KCData` / Normalized Layer**<br>*(tables: `player_progress`, `activity_events`, `daily_goals`)* | - `KCData.recordProgress()` (`js/data-layer.js:100`): called by `recordNormalizedGradeAnswer` (`index.html:5570`).<br>- `KCData.recordActivity()` (`js/data-layer.js:85`): called by `logActivity` (`index.html:2215`), `remediationStepQuestion` (`:5658`), and `answerTransferQuestion` (`:5770`).<br>- `KCData.recordDailyGoal()` (`js/data-layer.js:114`): called by `syncAdaptiveDailyGoal` (`index.html:5510, 5583`).<br>- `KCData.flushNormalized()`: upserts to Supabase. | - `KCData.fetchNormalizedProgress()` (`js/data-layer.js:179`): loaded by `loadCloudParentDashboard()` (`index.html:4471`).<br>- `KCData.fetchRecentActivity(days)` (`js/data-layer.js:190`): loaded by `loadCloudParentDashboard()`.<br>- `KCData.fetchSkillActivity(days)` (`js/data-layer.js:204`): loaded by `loadCloudParentDashboard()`. | - **Parent Dashboard Cloud Section**: Cloud learning report (Avg mastery, units tracked, needs practice count), hierarchical grade/subject/unit expandable tree (`cloudTreeUnitRow`), 7-day trend chart, 30-day skill progress graphs (`renderCloudSkillTimeline`), and cloud recovery timeline (`renderCloudRecoveryTimeline`). |
| **`KCSkillEngine` (`progress.skillStats[skillId]`)** | - `KCSkillEngine.updateSkillEvidence()` (`js/skill-engine.js:226`): called on each Grade question in `recordNormalizedGradeAnswer` (`index.html:5534`). Computes Bayesian mastery `((correct + 1)/(attempts + 2))*100`, increments attempts/firstTryCorrect, classifies misconceptions, and sets `nextReviewAt` (ISO string).<br>- `KCSkillEngine.recordRemediationEvidence()` (`js/skill-engine.js:281`): called on remediation step (`index.html:5675`) and transfer check (`:5749`). | - `KCSkillEngine.buildDailyMission()` (`js/skill-engine.js:318`): filters due / weak skills.<br>- `KCSkillEngine.tutorRecommendation()` (`js/skill-engine.js:370`): tutor prompt/scaffold mode.<br>- `KCSkillEngine.adaptiveScore()` (`js/skill-engine.js:409`): lesson selection difficulty score.<br>- `startGradeUnit()` (`index.html:5511`) & `nextGradeQuestion()` (`:5907`): adaptive selection context.<br>- `renderParentDashboard()` (`index.html:4579-4591`): adaptive skill rows, recovery stats, recovery timeline.<br>- `exportProgress()` (`index.html:4647`). | - **Parent Dashboard**: "Adaptive skill report" card (`skillRows`: attempts, first-try correct, status, common misconception), "Skill recovery" card (`recoveryRows`), and "Recovery timeline" (`renderSkillRecoveryTimeline`).<br>- **In-Lesson Experience**: Blipola tutor hints & misconceptions, adaptive question progression. |

---

## 3. Comparison: Parent Dashboard vs. Progress Page vs. Actual Storage

### Parent Dashboard (`renderParentDashboard`)
- **Kindergarten Content**: Reads `categoryLearningStats(cat)` derived directly from `progress.mastery` and `progress.due`.
- **Grade Curriculum**:
  - Locally reads `progress.skillStats` for adaptive skill metrics and remediation step history.
  - From cloud reads `KCData.fetchNormalizedProgress()` (`player_progress`), `KCData.fetchRecentActivity()` (`activity_events`), and `KCData.fetchSkillActivity()`.
- **Diamonds & Math Counters**: Reads `progress.stars` and `progress.mathCorrect`.

### Child Progress Page (`renderProgress`)
- **Kindergarten Content**: Reads `categoryMasteredAllLevels(c)` and `renderSkillMap()` (both backed by `progress.mastery` and `progress.due`).
- **World Progress**: Reads `progress.stars` and `getWorldSkillPercent` (backed by `categoryLearningStats`).
- **Math Game**: Reads `progress.mathCorrect` (`Math solved: X total`).
- **Grade Courses**: Progress for Grade units is accessed via the Grade Course selection screen (`renderGradeCourse`), backed by `progress.gradeMastery`.

---

## 4. Why Stores 1 (`mastery`) and 2 (`gradeMastery`) Must NOT Be Merged

1. **Different granularities**:
   - `progress.mastery` is an item-level spaced repetition counter (item IDs like `ant`, `apple`, `sun`, `num_5`).
   - `progress.gradeMastery` is a unit-level session counter (`grade_course_unit`) tracking how many questions in the unit bank have been cleared on first try.
2. **Different learning models**:
   - Kindergarten operates on flashcard-style recognition and repetition with decay on review failure.
   - Grade 1 & 2 interactive courses operate on structured lesson units (Lesson → Practice → Quiz) backed by `KCSkillEngine` misconception models.
3. **No semantic collision**:
   - No code reads `progress.mastery` expecting Grade unit data, and no code reads `progress.gradeMastery` expecting Kindergarten items.
   - Merging them into a single schema would violate the zero-abstraction rule and break backward compatibility with existing player save games.

---

## 5. Identified Inconsistencies & Fixes

### Fix 1: Parent Dashboard `s.nextReviewAt` Date Parsing
- **Bug**: In `index.html:4580`:
  ```javascript
  const due = s.nextReviewAt && Date.now() >= Number(s.nextReviewAt);
  ```
  `s.nextReviewAt` is stored by `KCSkillEngine` as an ISO string (`"2026-09-30T..."`). `Number(isoString)` produces `NaN`, causing `due` to always evaluate to `false`.
- **Symptom**: When a skill was due for review, Blipola in the lesson tutor and the daily mission correctly treated it as due, and the cloud history section recognized it as due, but the local "Adaptive skill report" card in the Parent Dashboard showed `'🏆 Strong'` or `'🎯 Needs practice'` instead of `'🔄 Review due'`.
- **Resolution**:
  ```javascript
  const nextReview = s.nextReviewAt ? (Number.isFinite(Number(s.nextReviewAt)) ? Number(s.nextReviewAt) : Date.parse(s.nextReviewAt)) : 0;
  const due = nextReview > 0 && Date.now() >= nextReview;
  ```

### Fix 2: Parent Progress Export Missing `gradeMastery`
- **Bug**: `exportProgress()` dumped `stars`, `mastery`, `due`, `mathCorrect`, `mathStreak`, `skillStats`, and `remediationHistory`, but omitted `gradeMastery`.
- **Symptom**: Parents exporting progress for Grade 1 / 2 learners received a JSON backup missing unit progress.
- **Resolution**: Added `gradeMastery: progress.gradeMastery || {}` to `exportProgress()`.

### Fix 3: Division-by-Zero `NaN%` in `renderProgress()`
- **Bug**: `renderProgress()` mapped over `CATEGORIES` calculating `Math.round((mastered / total) * 100)`. For categories with dynamic question generation (`total === 0`), `0 / 0` evaluated to `NaN%`.
- **Resolution**: Guarded percentage calculation with `total > 0 ? Math.round((mastered / total) * 100) : 0`.

---

## 6. Verification
- Extracted self-test script: `scripts/test_progress_stores.js` directly verifies:
  1. `renderParentDashboard` review-due logic parsing ISO strings vs numeric timestamps.
  2. `exportProgress` JSON format containing all active progress properties (`mastery`, `due`, `gradeMastery`, `skillStats`).
  3. `renderProgress` percentage calculation without `NaN`.
- Integrated into `.github/workflows/validate.yml` `TEST_SCRIPTS`.
- Full `node --check` executed across all JavaScript files, shared files, data banks, service worker, and inline scripts.
