/**
 * Self-test for buildQuestion adaptive item weighting and sampling.
 * Run with: node scripts/test_build_question_weights.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Extract source directly from index.html
const htmlPath = path.resolve(__dirname, '../index.html');
assert(fs.existsSync(htmlPath), `index.html not found at ${htmlPath}`);
const html = fs.readFileSync(htmlPath, 'utf8');

// 1. Extract MASTERY_THRESHOLD from index.html (fail fast, no fallback)
const thresholdMatch = html.match(/const\s+MASTERY_THRESHOLD\s*=\s*(\d+);/);
assert(thresholdMatch, 'Failed to extract MASTERY_THRESHOLD from index.html');
const MASTERY_THRESHOLD = parseInt(thresholdMatch[1], 10);
assert.strictEqual(MASTERY_THRESHOLD, 2, 'MASTERY_THRESHOLD in index.html must be 2');

// 2. Extract weighted sampling segment from buildQuestion in index.html
const bqStart = html.indexOf('function buildQuestion(');
assert(bqStart !== -1, 'function buildQuestion not found in index.html');

const sampleStartKeyword = 'const weighted = items.map(';
const sampleStartIdx = html.indexOf(sampleStartKeyword, bqStart);
assert(sampleStartIdx !== -1, 'Could not find start of weighted sampling in buildQuestion');

const targetIdKeyword = 'if (targetId) {';
const targetIdIdx = html.indexOf(targetIdKeyword, sampleStartIdx);
assert(targetIdIdx !== -1, 'Could not find "if (targetId) {" in buildQuestion');

const targetIdOpenBrace = html.indexOf('{', targetIdIdx);
assert(targetIdOpenBrace !== -1, 'Could not find opening brace for if (targetId)');
let depth = 0;
let sampleEndIdx = -1;
for (let i = targetIdOpenBrace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
        depth--;
        if (depth === 0) {
            sampleEndIdx = i + 1;
            break;
        }
    }
}
assert(sampleEndIdx !== -1, 'Could not find closing brace of if (targetId) block');

const samplingCode = html.slice(sampleStartIdx, sampleEndIdx);

// Assert non-empty and critical lines (fail fast, no fallback)
assert(samplingCode && samplingCode.length > 0, 'Extracted sampling code must not be empty');
assert(samplingCode.includes('items.map'), 'Sampling code must contain items.map');
assert(samplingCode.includes('count === 0'), 'Sampling code must check count === 0');
assert(samplingCode.includes('count < MASTERY_THRESHOLD'), 'Sampling code must check MASTERY_THRESHOLD');
assert(samplingCode.includes('w = 5') && samplingCode.includes('w = 3') && samplingCode.includes('w = 2') && samplingCode.includes('w = 0.4'),
    'Sampling code must contain exact weight assignments (5, 3, 2, 0.4)');
assert(samplingCode.includes('Math.random() * totalW'), 'Sampling code must perform random roll with totalW');
assert(samplingCode.includes('targetId'), 'Sampling code must handle targetId override');

const sampleItem = eval(`(function(items, getMasteryCount, isDue, catKey, targetId) {
${samplingCode}
    return correct;
})`);
assert.strictEqual(typeof sampleItem, 'function', 'sampleItem must evaluate to a function');

// 3. Also extract and test complete buildQuestion function with stubbed dependencies
function extractFunction(source, fnName) {
    const startPattern = `function ${fnName}(`;
    const startIdx = source.indexOf(startPattern);
    assert(startIdx !== -1, `Could not find "${startPattern}" in index.html`);
    const openBraceIdx = source.indexOf('{', startIdx);
    assert(openBraceIdx !== -1, `Could not find opening brace for "${fnName}"`);
    let d = 0;
    let end = -1;
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
            d++;
        } else if (c === '}') {
            d--;
            if (d === 0) {
                end = i + 1;
                break;
            }
        }
    }
    assert(end !== -1, `Could not find matching closing brace for "${fnName}"`);
    return source.slice(startIdx, end);
}

const buildQuestionSource = extractFunction(html, 'buildQuestion');
assert(buildQuestionSource && buildQuestionSource.length > 0, 'Extracted buildQuestion source must not be empty');
assert(buildQuestionSource.includes('function buildQuestion('), 'Extracted buildQuestion must declare function buildQuestion');
assert(buildQuestionSource.includes('const catKey = `${key}_${level}`'), 'Extracted buildQuestion must build catKey');

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

// Test complete buildQuestion with stubbed dependencies
{
    const stubGetMasteryCount = (cat, id) => mockMastery[`${cat}_${id}`] || 0;
    const stubIsDue = (cat, id) => !!mockDue[`${cat}_${id}`];
    const stubPickChoices = (items, correct, count) => [correct];

    const buildQuestion = eval(`(function(getMasteryCount, isDue, pickChoices) {
        return (${buildQuestionSource});
    })`)(stubGetMasteryCount, stubIsDue, stubPickChoices);

    const lettersItems = [
        { id: 'A', word: 'Apple', emoji: '🍎' },
        { id: 'B', word: 'Banana', emoji: '🍌' }
    ];

    for (let i = 0; i < 20; i++) {
        const qTarget = buildQuestion('letters', lettersItems, 'L1', 'B');
        assert(qTarget && qTarget.itemId === 'B', 'buildQuestion must respect targetId override');
        assert(Array.isArray(qTarget.choices), 'buildQuestion must return choices array');
    }
    console.log('✓ Full buildQuestion execution with stubbed dependencies verified');
}

console.log('\nAll buildQuestion weighting tests PASSED! ✅');
