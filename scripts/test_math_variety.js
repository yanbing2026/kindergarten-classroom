/**
 * Self-test for Math Question Variety and Level Distribution.
 *
 * Verifies:
 * 1. buildMathQuestion extracted directly from index.html (no copies).
 * 2. For L1-L10 (400 questions per level):
 *    (a) Deduplicated unique question count meets thresholds (L1 >= 40, L2 >= 80, L3-L10 >= 100).
 *    (b) Correct answer strictly appears in choices with exactly 4 distinct choices.
 *    (c) Answer falls strictly within the level's expected answer range.
 *    (d) Early levels (L1, L2) generate at least 2 distinct question types (CCSS K.CC.B.5, K.CC.C.6, K.OA.A.4).
 *
 * Run with: node scripts/test_math_variety.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

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

// Extract dependencies directly from index.html
const shuffleSource = extractFunction(html, 'shuffle');
const opsForLevelSource = extractFunction(html, 'opsForLevel');
const buildMathQuestionSource = extractFunction(html, 'buildMathQuestion');

assert(buildMathQuestionSource && buildMathQuestionSource.length > 0, 'Extracted buildMathQuestion source must not be empty');
assert(buildMathQuestionSource.includes('function buildMathQuestion('), 'Source must contain buildMathQuestion declaration');
assert(buildMathQuestionSource.includes('allowMissingAddend') || buildMathQuestionSource.includes('missing_addend'), 'Source must support missing addend');
assert(buildMathQuestionSource.includes('allowCount') || buildMathQuestionSource.includes('count'), 'Source must support counting');
assert(buildMathQuestionSource.includes('allowCompare') || buildMathQuestionSource.includes('compare'), 'Source must support comparison');
assert(buildMathQuestionSource.includes('allowTenFrame') || buildMathQuestionSource.includes('ten_frame'), 'Source must support ten-frame');

// Evaluate in test environment
const shuffle = eval(`(${shuffleSource})`);
const opsForLevel = eval(`(${opsForLevelSource})`);
const MATH_SYMBOL = { add: '+', sub: '−', mul: '×', div: '÷' };
const MATH_WORD = { add: 'plus', sub: 'minus', mul: 'times', div: 'divided by' };
const progress = { mathCorrect: {}, mathStreak: 0 };

const buildMathQuestion = eval(`(${buildMathQuestionSource})`);
assert.strictEqual(typeof buildMathQuestion, 'function', 'buildMathQuestion must evaluate to a function');

console.log('Testing buildMathQuestion question variety and distribution across L1-L10...\n');

const SAMPLES_PER_LEVEL = 400;
const results = [];

for (let lv = 1; lv <= 10; lv++) {
    const levelKey = `L${lv}`;
    const minAnswer = (lv - 1) * 10 + 1;
    const maxAnswer = lv * 10;
    const uniqueKeys = new Set();
    const typeCounts = {};
    let allChoicesValid = true;
    let allAnswersInRange = true;
    let minObserved = Infinity;
    let maxObserved = -Infinity;

    for (let i = 0; i < SAMPLES_PER_LEVEL; i++) {
        const q = buildMathQuestion(levelKey);

        // Assert contract fields
        assert(q !== null && typeof q === 'object', `Question must be an object at ${levelKey}`);
        assert(typeof q.answer === 'number' && !isNaN(q.answer), `q.answer must be a valid number at ${levelKey}`);
        assert(Array.isArray(q.choices), `q.choices must be an array at ${levelKey}`);
        assert.strictEqual(q.choices.length, 4, `q.choices must have exactly 4 options at ${levelKey}`);

        // Distinct choices
        const choiceSet = new Set(q.choices);
        assert.strictEqual(choiceSet.size, 4, `All 4 choices must be distinct at ${levelKey}`);

        // (b) Correct answer must appear in choices
        if (!choiceSet.has(q.answer)) {
            allChoicesValid = false;
        }

        // (c) Answer must fall in level range
        if (q.answer < minAnswer || q.answer > maxAnswer) {
            allAnswersInRange = false;
        }

        minObserved = Math.min(minObserved, q.answer);
        maxObserved = Math.max(maxObserved, q.answer);

        // Record type
        const type = q.type || q.op || 'unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;

        // Unique question key for deduplication
        const key = `${q.type || q.op}::${q.promptHTML || (q.a + ' ' + q.op + ' ' + q.b)}::${q.answer}`;
        uniqueKeys.add(key);
    }

    const uniqueCount = uniqueKeys.size;
    const distinctTypes = Object.keys(typeCounts);

    // Assert (b) Correct answer in choices
    assert(allChoicesValid, `All questions at ${levelKey} must contain correct answer in choices`);

    // Assert (c) Answer range
    assert(allAnswersInRange, `All questions at ${levelKey} must have answer in [${minAnswer}, ${maxAnswer}], observed [${minObserved}, ${maxObserved}]`);

    // Assert (d) Early levels (L1, L2) must generate at least 2 distinct types
    if (lv <= 2) {
        assert(distinctTypes.length >= 2, `Early level ${levelKey} must have >= 2 question types, found: ${distinctTypes.join(', ')}`);
    }

    // Assert (a) Deduplicated unique question count thresholds:
    // L1 >= 40, L2 >= 80, L3-L10 >= 100
    const minThreshold = (lv === 1) ? 40 : (lv === 2 ? 80 : 100);
    assert(uniqueCount >= minThreshold, `Unique question count at ${levelKey} (${uniqueCount}) must be >= ${minThreshold}`);

    results.push({
        level: levelKey,
        unique: uniqueCount,
        threshold: minThreshold,
        types: distinctTypes,
        minObserved,
        maxObserved,
        expectedRange: `[${minAnswer}, ${maxAnswer}]`
    });

    console.log(`✓ ${levelKey}: ${uniqueCount} unique questions (min threshold ${minThreshold}) | Types: [${distinctTypes.join(', ')}] | Answers: [${minObserved}, ${maxObserved}]`);
}

console.log('\n--- Summary Table ---');
console.log('Level | Unique / 400 | Min Threshold | Types Count | Expected Range | Answer Range');
console.log('------|--------------|---------------|-------------|----------------|-------------');
for (const r of results) {
    console.log(`${r.level.padEnd(5)} | ${String(r.unique).padStart(12)} | ${String(r.threshold).padStart(13)} | ${String(r.types.length).padStart(11)} | ${r.expectedRange.padEnd(14)} | [${r.minObserved}, ${r.maxObserved}]`);
}

console.log('\nAll math variety tests PASSED! ✅');
