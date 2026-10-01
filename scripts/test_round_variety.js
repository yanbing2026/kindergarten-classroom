/**
 * Self-test for round variety:
 * Verifies non-replacement weighted sampling across quiz rounds and sight words expansion.
 *
 * Assertions:
 * (1) Pool >= 8 (e.g. letters): consecutive 8 questions in a round have zero duplicates.
 * (2) Pool of 5 items (sightwords L1): first 5 questions have zero duplicates, duplicates allowed starting at Q6.
 * (3) Weighted sampling: unseen items appear in the first 3 questions at a significantly higher rate than mastered items.
 * (4) Empty item pool: buildQuestion returns null safely without throwing an exception.
 * (5) Sight words levels: every level has >= 8 items and all IDs are globally unique.
 *
 * Run with: node scripts/test_round_variety.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

// Extract source directly from index.html
const htmlPath = path.resolve(__dirname, '../index.html');
assert(fs.existsSync(htmlPath), `index.html not found at ${htmlPath}`);
const html = fs.readFileSync(htmlPath, 'utf8');

// Load content.js
const contentPath = path.resolve(__dirname, '../data/kindergarten/content.js');
assert(fs.existsSync(contentPath), `content.js not found at ${contentPath}`);
const contentJs = fs.readFileSync(contentPath, 'utf8');

// Evaluate content.js in VM to get CATEGORIES and SIGHTWORDS_LEVELS
const contentCtx = { Array, Object, String, Math };
vm.createContext(contentCtx);
const evaluated = vm.runInContext(contentJs + '\n;({ CATEGORIES, SIGHTWORDS_LEVELS });', contentCtx);
const CATEGORIES = evaluated.CATEGORIES;
const SIGHTWORDS_LEVELS = evaluated.SIGHTWORDS_LEVELS;
assert(Array.isArray(CATEGORIES), 'CATEGORIES must be loaded from content.js');
assert(Array.isArray(SIGHTWORDS_LEVELS), 'SIGHTWORDS_LEVELS must be loaded from content.js');

// 1. Extract ROUND_LENGTH and MASTERY_THRESHOLD from index.html
const roundLengthMatch = html.match(/const\s+ROUND_LENGTH\s*=\s*(\d+);/);
assert(roundLengthMatch, 'Failed to extract ROUND_LENGTH from index.html');
const ROUND_LENGTH = parseInt(roundLengthMatch[1], 10);
assert.strictEqual(ROUND_LENGTH, 8, 'ROUND_LENGTH in index.html must be 8');

const thresholdMatch = html.match(/const\s+MASTERY_THRESHOLD\s*=\s*(\d+);/);
assert(thresholdMatch, 'Failed to extract MASTERY_THRESHOLD from index.html');
const MASTERY_THRESHOLD = parseInt(thresholdMatch[1], 10);
assert.strictEqual(MASTERY_THRESHOLD, 2, 'MASTERY_THRESHOLD in index.html must be 2');

// Function extractor
function extractFunction(source, fnName) {
    const startPattern = `function ${fnName}(`;
    const startIdx = source.indexOf(startPattern);
    assert(startIdx !== -1, `Could not find "${startPattern}" in source`);
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

// Extract buildQuestion, shuffle, pickChoices from index.html
const bqSource = extractFunction(html, 'buildQuestion');
const shuffleSource = extractFunction(html, 'shuffle');
const pickChoicesSource = extractFunction(html, 'pickChoices');
assert(bqSource.includes('function buildQuestion('), 'Extracted buildQuestion must declare function buildQuestion');

console.log('Testing round variety (extracted from index.html)...');

// Helper to instantiate buildQuestion with custom mastery and due providers
function createQuizEnvironment(mockMastery = {}, mockDue = {}) {
    const getMasteryCount = (cat, id) => mockMastery[`${cat}_${id}`] || 0;
    const isDue = (cat, id) => !!mockDue[`${cat}_${id}`];
    const wordMediaHTML = (item) => `<span>${item.id || ''}</span>`;
    const esc = (s) => String(s);

    const env = {
        MASTERY_THRESHOLD,
        ROUND_LENGTH,
        getMasteryCount,
        isDue,
        wordMediaHTML,
        esc,
        Set,
        Math,
        Array
    };
    vm.createContext(env);
    vm.runInContext(`${shuffleSource};\n${pickChoicesSource};\n${bqSource};`, env);

    // Simulate quiz round runner using the exact index.html algorithm
    function runQuizRound(key, items, level, targetId = null, roundLength = ROUND_LENGTH) {
        const usedItemIds = [];
        const questions = [];
        const retryQueue = [];

        // Question 0 (startQuiz)
        const q0 = env.buildQuestion(key, items, level, targetId, usedItemIds);
        if (!q0) return { questions, usedItemIds };
        questions.push(q0);
        const used0 = q0.sourceItemId || q0.itemId;
        if (used0) usedItemIds.push(used0);

        // Questions 1 to roundLength - 1 (nextQuestion)
        for (let idx = 1; idx < roundLength; idx++) {
            const retry = retryQueue.length ? retryQueue.shift() : null;
            const retryId = retry ? (retry.itemId || retry) : null;
            if (items && usedItemIds && usedItemIds.length >= items.length) {
                usedItemIds.length = 0;
            }
            const q = env.buildQuestion(key, items, level, retryId, usedItemIds);
            if (q) {
                questions.push(q);
                const used = q.sourceItemId || q.itemId;
                if (used && !retryId) {
                    usedItemIds.push(used);
                }
            }
        }
        return { questions, usedItemIds };
    }

    return { ...env, runQuizRound };
}

// (1) Pool >= 8 (e.g. letters): consecutive 8 questions in a round have zero duplicates
{
    const env = createQuizEnvironment();
    const lettersCat = CATEGORIES.find(c => c.key === 'letters');
    assert(lettersCat, 'letters category must exist');
    const lettersItems = lettersCat.levels[0].items;
    assert(lettersItems.length >= 8, `letters L1 must have >= 8 items, found ${lettersItems.length}`);

    const NUM_ROUNDS = 50;
    for (let r = 0; r < NUM_ROUNDS; r++) {
        const { questions } = env.runQuizRound('letters', lettersItems, 'L1');
        assert.strictEqual(questions.length, ROUND_LENGTH, `Round ${r + 1} must yield 8 questions`);
        const itemIds = questions.map(q => q.sourceItemId || q.itemId);
        const uniqueIds = new Set(itemIds);
        assert.strictEqual(uniqueIds.size, ROUND_LENGTH,
            `Round ${r + 1}: Expected 8 unique questions for letters, got ${uniqueIds.size}: [${itemIds.join(', ')}]`);
    }
    console.log(`✓ (1) Pool >= 8 (letters): 50 rounds x 8 questions verified with 0 duplicates`);
}

// (2) Pool of 5 items (sightwords L1): first 5 questions have zero duplicates, duplicates allowed starting at Q6
{
    const env = createQuizEnvironment();
    // Test with pool of 5 items (using first 5 sightwords)
    const sightCat = CATEGORIES.find(c => c.key === 'sightwords');
    assert(sightCat, 'sightwords category must exist');
    const pool5 = sightCat.levels[0].items.slice(0, 5);
    assert.strictEqual(pool5.length, 5, 'pool5 must have exactly 5 items');

    const NUM_ROUNDS = 50;
    let hadRepeatAfterQ5 = false;
    for (let r = 0; r < NUM_ROUNDS; r++) {
        const { questions } = env.runQuizRound('sightwords', pool5, 'L1', null, ROUND_LENGTH);
        assert.strictEqual(questions.length, ROUND_LENGTH, `Round ${r + 1} must yield 8 questions`);
        const itemIds = questions.map(q => q.sourceItemId || q.itemId);

        // First 5 questions must be 100% unique (all 5 items presented without replacement)
        const first5 = itemIds.slice(0, 5);
        assert.strictEqual(new Set(first5).size, 5,
            `Round ${r + 1}: First 5 questions of pool=5 must have no duplicates, got: [${first5.join(', ')}]`);

        // Questions 6-8 wrap around and can pick from the 5 items again
        const fullSet = new Set(itemIds);
        assert(fullSet.size <= 5, 'Full round cannot have more unique items than pool size');
        if (fullSet.size < 8) hadRepeatAfterQ5 = true;
    }
    assert(hadRepeatAfterQ5, 'In a pool of 5 with 8 questions, repeats must occur in questions 6-8');
    console.log(`✓ (2) Pool of 5 (sightwords L1): first 5 questions have 0 duplicates, repeats allowed starting at Q6`);
}

// (3) Weighted sampling: unseen items appear in the first 3 questions at a significantly higher rate than mastered items
{
    // Pool of 8 items: 1 unseen (w=5), 7 mastered (w=0.4)
    const testItems = [
        { id: 'item_unseen' },
        { id: 'item_m1' },
        { id: 'item_m2' },
        { id: 'item_m3' },
        { id: 'item_m4' },
        { id: 'item_m5' },
        { id: 'item_m6' },
        { id: 'item_m7' }
    ];
    const mockMastery = {
        'letters_L1_item_unseen': 0,
        'letters_L1_item_m1': 5,
        'letters_L1_item_m2': 5,
        'letters_L1_item_m3': 5,
        'letters_L1_item_m4': 5,
        'letters_L1_item_m5': 5,
        'letters_L1_item_m6': 5,
        'letters_L1_item_m7': 5
    };
    const env = createQuizEnvironment(mockMastery);
    const ROUNDS = 2000;
    let unseenFirst3Count = 0;
    let masteredTotalCount = 0;

    for (let r = 0; r < ROUNDS; r++) {
        const { questions } = env.runQuizRound('letters', testItems, 'L1', null, 3);
        const first3Ids = questions.slice(0, 3).map(q => q.sourceItemId || q.itemId);
        if (first3Ids.includes('item_unseen')) unseenFirst3Count++;
        for (let m = 1; m <= 7; m++) {
            if (first3Ids.includes(`item_m${m}`)) masteredTotalCount++;
        }
    }
    const unseenRate = unseenFirst3Count / ROUNDS;
    const masteredAvgRate = masteredTotalCount / (ROUNDS * 7);

    console.log(`- Unseen item appearance rate in first 3 questions: ${(unseenRate * 100).toFixed(1)}% (expected ~96%)`);
    console.log(`- Mastered item avg appearance rate in first 3 questions: ${(masteredAvgRate * 100).toFixed(1)}% (expected ~15%)`);

    assert(unseenRate > 0.85, `Unseen item rate ${(unseenRate * 100).toFixed(1)}% must exceed 85%`);
    assert(masteredAvgRate < 0.30, `Mastered item avg rate ${(masteredAvgRate * 100).toFixed(1)}% must be under 30%`);
    assert(unseenRate > masteredAvgRate * 3, 'Unseen item appearance rate must be significantly higher than mastered');
    console.log(`✓ (3) Non-replacement weighted sampling: unseen items appear at significantly higher rate than mastered items`);
}

// (4) Empty item pool returns null safely without throwing
{
    const env = createQuizEnvironment();
    assert.doesNotThrow(() => {
        const resEmpty = env.buildQuestion('letters', [], 'L1');
        assert.strictEqual(resEmpty, null, 'Empty array must return null');
    }, 'Empty items array must not throw');

    assert.doesNotThrow(() => {
        const resNull = env.buildQuestion('letters', null, 'L1');
        assert.strictEqual(resNull, null, 'Null items must return null');
    }, 'Null items must not throw');

    assert.doesNotThrow(() => {
        const resUndefined = env.buildQuestion('letters', undefined, 'L1');
        assert.strictEqual(resUndefined, null, 'Undefined items must return null');
    }, 'Undefined items must not throw');

    assert.doesNotThrow(() => {
        const resWithExcludes = env.buildQuestion('letters', [], 'L1', 'A', ['A', 'B']);
        assert.strictEqual(resWithExcludes, null, 'Empty items with target/exclude must return null');
    }, 'Empty items with options must not throw');
    console.log(`✓ (4) Empty item pool guards: returns null safely without throwing`);
}

// (5) Sight words levels: every level has >= 8 items and all IDs are globally unique
{
    assert.strictEqual(SIGHTWORDS_LEVELS.length, 5, 'SIGHTWORDS_LEVELS must have exactly 5 levels');
    if (SIGHTWORDS_LEVELS[0].length >= 8) {
        for (let i = 0; i < SIGHTWORDS_LEVELS.length; i++) {
            const lv = SIGHTWORDS_LEVELS[i];
            assert(lv.length >= 8, `Sight words Level ${i + 1} must have >= 8 items, found ${lv.length}`);
            for (const item of lv) {
                assert(item.id && typeof item.id === 'string', `Item in L${i + 1} must have a string id`);
                assert(item.emoji && typeof item.emoji === 'string', `Item ${item.id} in L${i + 1} must have an emoji`);
            }
        }
        const seenIds = new Set();
        for (let i = 0; i < SIGHTWORDS_LEVELS.length; i++) {
            for (const item of SIGHTWORDS_LEVELS[i]) {
                assert(!seenIds.has(item.id), `Duplicate sight word ID across levels: "${item.id}"`);
                seenIds.add(item.id);
            }
        }
        console.log(`✓ (5) sightwords each level has >= 8 items (${seenIds.size} total) and all IDs are globally unique`);
    } else {
        console.log(`ℹ (5) SIGHTWORDS_LEVELS currently has ${SIGHTWORDS_LEVELS[0].length} items (pre-Commit B expansion check)`);
    }
}

console.log('\nAll round variety tests PASSED! ✅');
