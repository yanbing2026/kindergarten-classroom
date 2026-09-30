/**
 * Self-test for Math adaptive difficulty transitions.
 * Run with: node scripts/test_math_adaptive.js
 */
const assert = require('assert');

// Core adaptive step function exactly as in index.html
function stepMathAdaptive(currentLevel, streak, isCorrect) {
    let lvNum = parseInt(String(currentLevel || 'L1').replace(/\D/g, ''), 10) || 1;
    let newStreak = streak || 0;
    let newLevel = currentLevel || ('L' + lvNum);
    let changed = false;

    if (isCorrect) {
        newStreak = (newStreak > 0 ? newStreak : 0) + 1;
        if (newStreak >= 3) {
            if (lvNum < 10) {
                lvNum += 1;
                newLevel = 'L' + lvNum;
                changed = true;
            }
            newStreak = 0;
        }
    } else {
        newStreak = (newStreak < 0 ? newStreak : 0) - 1;
        if (newStreak <= -3) {
            if (lvNum > 1) {
                lvNum -= 1;
                newLevel = 'L' + lvNum;
                changed = true;
            }
            newStreak = 0;
        }
    }
    return { level: newLevel, streak: newStreak, changed };
}

console.log('Testing stepMathAdaptive...');

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
