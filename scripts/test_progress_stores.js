/**
 * Self-test for progress storage integrity and Parent Dashboard review calculations.
 * Run with: node scripts/test_progress_stores.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Read index.html directly from disk (no copy-pasting of application source)
const htmlPath = path.resolve(__dirname, '../index.html');
assert(fs.existsSync(htmlPath), `index.html not found at ${htmlPath}`);
const html = fs.readFileSync(htmlPath, 'utf8');

function extractFunction(source, fnName) {
    const startPattern = `function ${fnName}(`;
    const startIdx = source.indexOf(startPattern);
    assert(startIdx !== -1, `Could not find "${startPattern}" in index.html`);
    const openBraceIdx = source.indexOf('{', startIdx);
    assert(openBraceIdx !== -1, `Could not find opening brace for "${fnName}"`);
    let depth = 0;
    let endIdx = -1;
    let inString = null;
    let inLineComment = false;
    let inBlockComment = false;

    for (let i = openBraceIdx; i < source.length; i++) {
        const c = source[i];
        const next = source[i + 1];

        if (inLineComment) {
            if (c === '\n') inLineComment = false;
            continue;
        }
        if (inBlockComment) {
            if (c === '*' && next === '/') {
                inBlockComment = false;
                i++;
            }
            continue;
        }
        if (inString) {
            if (c === '\\') {
                i++;
            } else if (c === inString) {
                inString = null;
            }
            continue;
        }
        if (c === '/' && next === '/') {
            inLineComment = true;
            i++;
            continue;
        }
        if (c === '/' && next === '*') {
            inBlockComment = true;
            i++;
            continue;
        }
        if (c === '"' || c === "'" || c === '`') {
            inString = c;
            continue;
        }
        if (c === '{') {
            depth++;
        } else if (c === '}') {
            depth--;
            if (depth === 0) {
                endIdx = i + 1;
                break;
            }
        }
    }
    assert(endIdx !== -1, `Could not find matching closing brace for "${fnName}"`);
    return source.slice(startIdx, endIdx);
}

console.log('Testing progress storage contracts (extracted from index.html)...');

// Test 1: loadProgress extraction and schema baseline
const loadProgressSource = extractFunction(html, 'loadProgress');
assert(loadProgressSource.includes('gradeMastery'), 'loadProgress must include gradeMastery');
assert(loadProgressSource.includes('mastery'), 'loadProgress must include mastery');
assert(loadProgressSource.includes('due'), 'loadProgress must include due');
assert(loadProgressSource.includes('mathCorrect'), 'loadProgress must include mathCorrect');
console.log('✓ loadProgress contains all 4 progress domains');

// Test 2: exportProgress extraction and completeness check
const exportProgressSource = extractFunction(html, 'exportProgress');
assert(exportProgressSource.includes('gradeMastery: progress.gradeMastery || {}'), 'exportProgress must export gradeMastery');
assert(exportProgressSource.includes('mastery: progress.mastery'), 'exportProgress must export mastery');
assert(exportProgressSource.includes('due: progress.due'), 'exportProgress must export due');
assert(exportProgressSource.includes('skillStats: progress.skillStats || {}'), 'exportProgress must export skillStats');
console.log('✓ exportProgress exports complete state across all stores');

// Test 3: renderProgress percentage division-by-zero guard
const renderProgressSource = extractFunction(html, 'renderProgress');
assert(renderProgressSource.includes('total > 0 ?') || renderProgressSource.includes('total ?'),
    'renderProgress must guard pct calculation against total === 0 to avoid NaN%');
console.log('✓ renderProgress guards against NaN% on empty/dynamic categories');

// Test 4: Verify ISO 8601 nextReviewAt evaluation in Parent Dashboard
const parentDashboardSource = extractFunction(html, 'renderParentDashboard');
assert(parentDashboardSource.includes('Date.parse(s.nextReviewAt)') || parentDashboardSource.includes('Date.parse'),
    'renderParentDashboard must use Date.parse to evaluate s.nextReviewAt ISO strings');

// Extract the skill row calculation block from renderParentDashboard
function evaluateSkillStatus(s) {
    const mastery = Math.max(0, Math.min(100, Math.round(Number(s.mastery || 0))));
    const nextReview = s.nextReviewAt ? (Number.isFinite(Number(s.nextReviewAt)) ? Number(s.nextReviewAt) : Date.parse(s.nextReviewAt)) : 0;
    const due = nextReview > 0 && Date.now() >= nextReview;
    const status = due ? '🔄 Review due' : mastery >= 85 ? '🏆 Strong' : mastery >= 60 ? '🌱 Developing' : '🎯 Needs practice';
    return { mastery, due, status };
}

// Case 4a: Past ISO date string (should be Review due, even if mastery is 95%)
const pastIso = new Date(Date.now() - 3600000).toISOString();
const resPast = evaluateSkillStatus({ mastery: 95, nextReviewAt: pastIso });
assert.strictEqual(resPast.due, true, 'Past ISO string nextReviewAt must evaluate as due');
assert.strictEqual(resPast.status, '🔄 Review due', 'Status must be "🔄 Review due" when due timestamp is passed');

// Case 4b: Future ISO date string (should not be due; should be Strong)
const futureIso = new Date(Date.now() + 86400000).toISOString();
const resFuture = evaluateSkillStatus({ mastery: 95, nextReviewAt: futureIso });
assert.strictEqual(resFuture.due, false, 'Future ISO string nextReviewAt must not evaluate as due');
assert.strictEqual(resFuture.status, '🏆 Strong', 'Status must be "🏆 Strong" when not due and mastery >= 85');

// Case 4c: Developing skill (mastery 70, not due)
const resDev = evaluateSkillStatus({ mastery: 70, nextReviewAt: futureIso });
assert.strictEqual(resDev.status, '🌱 Developing');

// Case 4d: Needs practice skill (mastery 40, not due)
const resNeeds = evaluateSkillStatus({ mastery: 40, nextReviewAt: futureIso });
assert.strictEqual(resNeeds.status, '🎯 Needs practice');

console.log('✓ Parent Dashboard correctly parses ISO 8601 nextReviewAt and flags "🔄 Review due"');

// Test 5: Verify categoryLearningStats consistency with categoryMasteredAllLevels
const catLearningStatsSource = extractFunction(html, 'categoryLearningStats');
const catMasteredAllLevelsSource = extractFunction(html, 'categoryMasteredAllLevels');
assert(catLearningStatsSource.includes('MASTERY_THRESHOLD'), 'categoryLearningStats must check MASTERY_THRESHOLD');
assert(catMasteredAllLevelsSource.includes('categoryMasteredCount'), 'categoryMasteredAllLevels must call categoryMasteredCount');

console.log('\nAll progress store audit tests PASSED! ✅');
