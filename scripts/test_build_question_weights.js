/**
 * Self-test for buildQuestion adaptive item weighting and sampling.
 * Run with: node scripts/test_build_question_weights.js
 */
const assert = require('assert');

const MASTERY_THRESHOLD = 2;

// The exact sampling logic extracted from index.html buildQuestion
function sampleItem(items, getMasteryCount, isDue, catKey, targetId) {
    const weighted = items.map(it => {
        const count = getMasteryCount(catKey, it.id);
        const due = isDue(catKey, it.id);
        let w = 1;
        if (count === 0) w = 5;            // never seen — high priority
        else if (count < MASTERY_THRESHOLD) w = 3; // learning — medium-high
        else if (due) w = 2;                // mastered but due for review
        else w = 0.4;                       // mastered & not due — low
        return { it, w };
    });
    const totalW = weighted.reduce((a, x) => a + x.w, 0);
    let r = Math.random() * totalW, correct = weighted[0].it;
    for (const x of weighted) { r -= x.w; if (r <= 0) { correct = x.it; break; } }
    if (targetId) {
        const target = items.find(it => it.id === targetId);
        if (target) correct = target;
    }
    return correct;
}

console.log('Testing buildQuestion weighted sampling...');

const items = [
    { id: 'item_unseen' },
    { id: 'item_learning' },
    { id: 'item_due' },
    { id: 'item_mastered' }
];

const mockMastery = {
    'test_L1_item_unseen': 0,
    'test_L1_item_learning': 1,
    'test_L1_item_due': 2,
    'test_L1_item_mastered': 5
};

const mockDue = {
    'test_L1_item_due': true
};

const getMasteryCount = (catKey, id) => mockMastery[`${catKey}_${id}`] || 0;
const isDue = (catKey, id) => !!mockDue[`${catKey}_${id}`];

// Expected weights:
// unseen: 5
// learning: 3
// due: 2
// mastered: 0.4
// Total weight = 10.4
const expectedRatios = {
    item_unseen: 5 / 10.4,     // ~48.08%
    item_learning: 3 / 10.4,   // ~28.85%
    item_due: 2 / 10.4,        // ~19.23%
    item_mastered: 0.4 / 10.4  // ~3.85%
};

const ITERATIONS = 100000;
const counts = {
    item_unseen: 0,
    item_learning: 0,
    item_due: 0,
    item_mastered: 0
};

for (let i = 0; i < ITERATIONS; i++) {
    const picked = sampleItem(items, getMasteryCount, isDue, 'test_L1', null);
    counts[picked.id]++;
}

console.log(`\nSampled ${ITERATIONS} items:`);
for (const id of Object.keys(expectedRatios)) {
    const actualRatio = counts[id] / ITERATIONS;
    const expected = expectedRatios[id];
    const diff = Math.abs(actualRatio - expected);
    console.log(`- ${id}: actual ${(actualRatio * 100).toFixed(2)}%, expected ${(expected * 100).toFixed(2)}% (diff: ${(diff * 100).toFixed(2)}%)`);
    assert(diff < 0.015, `Expected frequency for ${id} within 1.5% of theoretical value, got diff: ${diff}`);
}
console.log('✓ Empirical distribution matches theoretical weights within ±1.5%');

// Test targetId override (critical for retryQueue and targeted lessons)
for (const target of items) {
    for (let i = 0; i < 50; i++) {
        const picked = sampleItem(items, getMasteryCount, isDue, 'test_L1', target.id);
        assert.strictEqual(picked.id, target.id, `targetId ${target.id} must override random draw`);
    }
}
console.log('✓ targetId override works 100% of the time (preserves retryQueue & spaced review)');

console.log('\nAll buildQuestion weighting tests PASSED! ✅');
