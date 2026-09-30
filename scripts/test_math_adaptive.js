/**
 * Self-test for Math adaptive difficulty transitions.
 * Run with: node scripts/test_math_adaptive.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Extract stepMathAdaptive function source directly from index.html
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

const stepMathAdaptiveSource = extractFunction(html, 'stepMathAdaptive');

// Assert extracted source is non-empty and contains critical logic lines (fail fast, no fallback)
assert(stepMathAdaptiveSource && stepMathAdaptiveSource.length > 0, 'Extracted stepMathAdaptive source must not be empty');
assert(stepMathAdaptiveSource.includes('function stepMathAdaptive('), 'Source must contain function declaration');
assert(stepMathAdaptiveSource.includes('newStreak >= 3'), 'Source must contain level-up condition (newStreak >= 3)');
assert(stepMathAdaptiveSource.includes('newStreak <= -3'), 'Source must contain level-down condition (newStreak <= -3)');
assert(stepMathAdaptiveSource.includes('lvNum < 10') && stepMathAdaptiveSource.includes('lvNum > 1'), 'Source must contain level boundary clamps (1 to 10)');
assert(stepMathAdaptiveSource.includes('return { level: newLevel, streak: newStreak, changed }'), 'Source must return level, streak, changed');

const stepMathAdaptive = eval(`(${stepMathAdaptiveSource})`);
assert.strictEqual(typeof stepMathAdaptive, 'function', 'stepMathAdaptive must evaluate to a function');

console.log('Testing stepMathAdaptive (extracted from index.html)...');

// Test 1: 3 consecutive correct answers level up from L1 to L2
let state = { level: 'L1', streak: 0 };
let res = stepMathAdaptive(state.level, state.streak, true);
assert.strictEqual(res.level, 'L1');
assert.strictEqual(res.streak, 1);
assert.strictEqual(res.changed, false);

res = stepMathAdaptive(res.level, res.streak, true);
assert.strictEqual(res.level, 'L1');
assert.strictEqual(res.streak, 2);
assert.strictEqual(res.changed, false);

res = stepMathAdaptive(res.level, res.streak, true);
assert.strictEqual(res.level, 'L2');
assert.strictEqual(res.streak, 0); // resets after level up
assert.strictEqual(res.changed, true);
console.log('✓ 3 consecutive correct triggers level up and resets streak to 0');

// Test 2: Another 3 consecutive correct answers level up from L2 to L3
res = stepMathAdaptive(res.level, res.streak, true);
assert.strictEqual(res.streak, 1);
res = stepMathAdaptive(res.level, res.streak, true);
assert.strictEqual(res.streak, 2);
res = stepMathAdaptive(res.level, res.streak, true);
assert.strictEqual(res.level, 'L3');
assert.strictEqual(res.streak, 0);
assert.strictEqual(res.changed, true);
console.log('✓ Subsequent 3 correct triggers L2 -> L3');

// Test 3: 3 consecutive wrong answers level down from L3 to L2
res = stepMathAdaptive(res.level, res.streak, false);
assert.strictEqual(res.level, 'L3');
assert.strictEqual(res.streak, -1);
assert.strictEqual(res.changed, false);

res = stepMathAdaptive(res.level, res.streak, false);
assert.strictEqual(res.level, 'L3');
assert.strictEqual(res.streak, -2);
assert.strictEqual(res.changed, false);

res = stepMathAdaptive(res.level, res.streak, false);
assert.strictEqual(res.level, 'L2');
assert.strictEqual(res.streak, 0); // resets after level down
assert.strictEqual(res.changed, true);
console.log('✓ 3 consecutive wrong triggers level down and resets streak to 0');

// Test 4: Another 3 wrong levels down from L2 to L1
res = stepMathAdaptive(res.level, res.streak, false);
res = stepMathAdaptive(res.level, res.streak, false);
res = stepMathAdaptive(res.level, res.streak, false);
assert.strictEqual(res.level, 'L1');
assert.strictEqual(res.streak, 0);
assert.strictEqual(res.changed, true);
console.log('✓ Subsequent 3 wrong triggers L2 -> L1');

// Test 5: Lower bound clamp at L1 (3 wrong at L1 stays at L1)
res = stepMathAdaptive(res.level, res.streak, false);
assert.strictEqual(res.streak, -1);
res = stepMathAdaptive(res.level, res.streak, false);
assert.strictEqual(res.streak, -2);
res = stepMathAdaptive(res.level, res.streak, false);
assert.strictEqual(res.level, 'L1', 'Should clamp at lower bound L1');
assert.strictEqual(res.streak, 0, 'Streak should reset to 0 even when clamped');
assert.strictEqual(res.changed, false, 'Changed flag false because level stayed L1');
console.log('✓ Lower bound clamp at L1 preserved (does not drop below L1)');

// Test 6: Upper bound clamp at L10 (3 correct at L10 stays at L10)
res = { level: 'L10', streak: 0 };
res = stepMathAdaptive(res.level, res.streak, true);
assert.strictEqual(res.streak, 1);
res = stepMathAdaptive(res.level, res.streak, true);
assert.strictEqual(res.streak, 2);
res = stepMathAdaptive(res.level, res.streak, true);
assert.strictEqual(res.level, 'L10', 'Should clamp at upper bound L10');
assert.strictEqual(res.streak, 0, 'Streak should reset to 0 even when clamped');
assert.strictEqual(res.changed, false, 'Changed flag false because level stayed L10');
console.log('✓ Upper bound clamp at L10 preserved (does not exceed L10)');

// Test 7: Streak flips on alternating answers (never reaches 3)
res = { level: 'L5', streak: 0 };
res = stepMathAdaptive(res.level, res.streak, true); // +1
assert.strictEqual(res.streak, 1);
res = stepMathAdaptive(res.level, res.streak, true); // +2
assert.strictEqual(res.streak, 2);
res = stepMathAdaptive(res.level, res.streak, false); // error breaks streak -> -1
assert.strictEqual(res.streak, -1);
assert.strictEqual(res.level, 'L5');

res = stepMathAdaptive(res.level, res.streak, true); // correct breaks negative streak -> +1
assert.strictEqual(res.streak, 1);
assert.strictEqual(res.level, 'L5');

res = stepMathAdaptive(res.level, res.streak, false); // -1
assert.strictEqual(res.streak, -1);
res = stepMathAdaptive(res.level, res.streak, false); // -2
assert.strictEqual(res.streak, -2);
res = stepMathAdaptive(res.level, res.streak, true); // breaks streak -> +1
assert.strictEqual(res.streak, 1);
assert.strictEqual(res.level, 'L5');
console.log('✓ Alternating answers correctly flip streak between positive and negative');

// Test 8: Graceful fallback for missing fields in old saves
res = stepMathAdaptive(undefined, undefined, true);
assert.strictEqual(res.level, 'L1');
assert.strictEqual(res.streak, 1);

res = stepMathAdaptive('L3', null, false);
assert.strictEqual(res.level, 'L3');
assert.strictEqual(res.streak, -1);
console.log('✓ Missing/undefined fields in legacy saves default gracefully');

// Test 9: Full round simulation (8 questions) with progress.mathCorrect & mathStreak tracking
const progress = { mathCorrect: {}, mathStreak: 0 };
let currentLevel = 'L1';
// Simulate answers: 3 correct (L1 -> L2), then 3 correct (L2 -> L3), then 2 wrong (stay L3 with streak -2)
const answers = [true, true, true, true, true, true, false, false];
const levelHistory = [];

for (let i = 0; i < answers.length; i++) {
    const isFirstTry = answers[i];
    levelHistory.push(currentLevel);
    if (isFirstTry) {
        progress.mathCorrect[currentLevel] = (progress.mathCorrect[currentLevel] || 0) + 1;
    }
    const adapt = stepMathAdaptive(currentLevel, progress.mathStreak, isFirstTry);
    currentLevel = adapt.level;
    progress.mathStreak = adapt.streak;
}

// Q1, Q2, Q3 should be solved at L1; Q4, Q5, Q6 should be solved at L2; Q7, Q8 at L3
assert.deepStrictEqual(levelHistory, ['L1', 'L1', 'L1', 'L2', 'L2', 'L2', 'L3', 'L3']);
assert.strictEqual(progress.mathCorrect['L1'], 3, 'L1 should have 3 solved');
assert.strictEqual(progress.mathCorrect['L2'], 3, 'L2 should have 3 solved');
assert.strictEqual(progress.mathCorrect['L3'] || 0, 0, 'L3 should have 0 solved because Q7 and Q8 had errors');
assert.strictEqual(progress.mathStreak, -2, 'Final streak should be -2 after 2 errors at L3');
assert.strictEqual(currentLevel, 'L3', 'Current level should be L3');
console.log('✓ Full 8-question round simulated: in-round level escalation and mathCorrect attribution verified');

console.log('\nAll Math adaptive tests PASSED! ✅');
