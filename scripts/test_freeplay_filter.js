/**
 * Self-test for N12 Free Play category filter:
 * Extracts filterFreeplayItems, setFreeplayCategory, and renderFreeplay directly
 * from index.html (no duplicates or copies of logic) and verifies:
 * 1. Filter logic extracts items matching the selected category.
 * 2. 'all' / falsy category returns items across all categories.
 * 3. Randomness is preserved on repeated category draws.
 * 4. Free Play UI renders the filter button row with 'All' + available categories.
 * 5. Active tab state reflects current category selection.
 * 6. Non-selected categories are excluded from card generation when filtered.
 *
 * Run with: node scripts/test_freeplay_filter.js
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
    let inRegex = false;
    let lastNonWs = '';

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
        if (inRegex) {
            if (c === '\\') {
                i++;
            } else if (c === '/') {
                inRegex = false;
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
        if (c === '/' && '(=,:!&|[?'.includes(lastNonWs)) {
            inRegex = true;
            continue;
        }
        if (c === '"' || c === "'" || c === '`') {
            inString = c;
            continue;
        }
        if (!/\s/.test(c)) {
            lastNonWs = c;
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

console.log('Testing N12 Free Play category filter (extracted from index.html)...');

// 1. Extract functions directly from index.html
const filterFreeplayItemsSrc = extractFunction(html, 'filterFreeplayItems');
const setFreeplayCategorySrc = extractFunction(html, 'setFreeplayCategory');
const renderFreeplaySrc = extractFunction(html, 'renderFreeplay');

// 2. Static source contract assertions
assert(html.includes("let freeplayCategory = 'all';"), "index.html must declare freeplayCategory initialized to 'all'");
assert(renderFreeplaySrc.includes('filterFreeplayItems('), 'renderFreeplay must invoke filterFreeplayItems()');
assert(renderFreeplaySrc.includes('freeplay-filter-bar'), 'renderFreeplay must render freeplay-filter-bar');
assert(renderFreeplaySrc.includes('freeplay-filter-btn'), 'renderFreeplay must render freeplay-filter-btn buttons');
assert(renderFreeplaySrc.includes('setFreeplayCategory('), 'renderFreeplay buttons must call setFreeplayCategory()');
assert(renderFreeplaySrc.includes('shuffle('), 'renderFreeplay must preserve shuffle() for randomized card drawing');
console.log('✓ Static extraction contracts verified');

// 3. Evaluate and test filterFreeplayItems logic
const filterFreeplayItems = eval(`(${filterFreeplayItemsSrc})`);

const sampleGroups = [
    { key: 'letters', id: 'A', level: 'L1' },
    { key: 'letters', id: 'B', level: 'L1' },
    { key: 'numbers', id: '1', level: 'L1' },
    { key: 'numbers', id: '2', level: 'L1' },
    { key: 'words', id: 'cat', level: 'L1' },
    { key: 'words', id: 'dog', level: 'L1' },
    { key: 'chinese', id: 'nihao', level: 'L1' },
    { key: 'spanish', id: 'hola', level: 'L1' },
];

// Test 'all' returns the entire pool
assert.strictEqual(
    filterFreeplayItems(sampleGroups, 'all').length,
    sampleGroups.length,
    "'all' category should return all items"
);
assert.strictEqual(
    filterFreeplayItems(sampleGroups, null).length,
    sampleGroups.length,
    "Falsy category should default to all items"
);
assert.strictEqual(
    filterFreeplayItems(sampleGroups, '').length,
    sampleGroups.length,
    "Empty string category should default to all items"
);

// Test specific category filtering
const filteredLetters = filterFreeplayItems(sampleGroups, 'letters');
assert.strictEqual(filteredLetters.length, 2);
assert(filteredLetters.every(g => g.key === 'letters'), "All items in filtered 'letters' must have key 'letters'");

const filteredWords = filterFreeplayItems(sampleGroups, 'words');
assert.strictEqual(filteredWords.length, 2);
assert(filteredWords.every(g => g.key === 'words'), "All items in filtered 'words' must have key 'words'");

const filteredChinese = filterFreeplayItems(sampleGroups, 'chinese');
assert.strictEqual(filteredChinese.length, 1);
assert.strictEqual(filteredChinese[0].id, 'nihao');

const filteredSpanish = filterFreeplayItems(sampleGroups, 'spanish');
assert.strictEqual(filteredSpanish.length, 1);
assert.strictEqual(filteredSpanish[0].id, 'hola');

const filteredNumbers = filterFreeplayItems(sampleGroups, 'numbers');
assert.strictEqual(filteredNumbers.length, 2);
assert(filteredNumbers.every(g => g.key === 'numbers'));

console.log('✓ filterFreeplayItems accurately filters by category key and defaults to all');

// 4. Test setFreeplayCategory state and render trigger
let renderCalled = false;
global.render = () => { renderCalled = true; };
global.freeplayCategory = 'all';

const setFreeplayCategory = eval(`(${setFreeplayCategorySrc})`);

setFreeplayCategory('words');
assert.strictEqual(global.freeplayCategory, 'words', "setFreeplayCategory('words') should set freeplayCategory to 'words'");
assert.strictEqual(renderCalled, true, 'setFreeplayCategory must trigger render()');

renderCalled = false;
setFreeplayCategory('');
assert.strictEqual(global.freeplayCategory, 'all', 'setFreeplayCategory with falsy value should reset to all');
assert.strictEqual(renderCalled, true);
console.log('✓ setFreeplayCategory updates state and triggers re-render');

// 5. Test renderFreeplay() end-to-end HTML output
// Build minimal mock environment
global.CATEGORIES = [
    { key: 'letters', name: 'Letters', icon: '🔤', levels: [{ id: 'L1', items: [{ id: 'A' }, { id: 'B' }] }] },
    { key: 'numbers', name: 'Numbers', icon: '🔢', levels: [{ id: 'L1', items: [{ id: '1', n: 1 }, { id: '2', n: 2 }] }] },
    { key: 'words', name: 'English', icon: '📖', levels: [{ id: 'L1', items: [{ id: 'ant', emoji: '🐜' }, { id: 'cat', emoji: '🐱' }] }] },
    { key: 'chinese', name: 'Chinese', icon: '🇨🇳', levels: [{ id: 'L1', items: [{ id: 'nihao', hanzi: '你好', en: 'Hello', emoji: '👋' }] }] },
    { key: 'spanish', name: 'Spanish', icon: '🇪🇸', levels: [{ id: 'L1', items: [{ id: 'hola', es: 'Hola', en: 'Hello', emoji: '👋' }] }] },
    { key: 'math', name: 'Math', icon: '➕', levels: [{ id: 'L1', items: [{ id: 'm1' }] }] },
];
global.getCategoryItems = (key, level) => {
    const cat = global.CATEGORIES.find(c => c.key === key);
    return cat ? cat.levels[0].items : [];
};
global.wordMediaHTML = (item, size) => `<span class="emoji-mock">${item.emoji || ''}</span>`;
global.shuffle = (arr) => [...arr]; // Identity for deterministic assertion
global.topbar = () => '<header class="topbar-mock"></header>';
global.esc = (s) => String(s);

// Test 5a: Render with 'all' active
global.freeplayCategory = 'all';
const renderFreeplay = eval(`(${renderFreeplaySrc})`);
const htmlAll = renderFreeplay();

assert(htmlAll.includes('class="freeplay-filter-bar"'), 'HTML must include filter bar container');
assert(htmlAll.includes('class="freeplay-filter-btn active" onclick="setFreeplayCategory(\'all\')" role="tab" aria-selected="true">All</button>'), "All button must be active when freeplayCategory is 'all'");
assert(htmlAll.includes('🔤 Letters'), 'Filter row must include Letters category');
assert(htmlAll.includes('📖 English'), 'Filter row must include English category');
assert(htmlAll.includes('🇨🇳 Chinese'), 'Filter row must include Chinese category');
assert(htmlAll.includes('🇪🇸 Spanish'), 'Filter row must include Spanish category');
assert(!htmlAll.includes('➕ Math'), 'Filter row must skip excluded categories (math)');
assert(htmlAll.includes("onclick=\"learnTap('letters','A','L1')\""), 'Rendered cards must include letters');
assert(htmlAll.includes("onclick=\"learnTap('words','ant','L1')\""), 'Rendered cards must include words');
console.log("✓ renderFreeplay() renders filter row with 'All' active and includes all available categories");

// Test 5b: Render with 'words' active
global.freeplayCategory = 'words';
const htmlWords = renderFreeplay();

assert(htmlWords.includes('class="freeplay-filter-btn" onclick="setFreeplayCategory(\'all\')" role="tab" aria-selected="false">All</button>'), "All button must NOT be active when freeplayCategory is 'words'");
assert(htmlWords.includes('class="freeplay-filter-btn active" onclick="setFreeplayCategory(\'words\')" role="tab" aria-selected="true">📖 English</button>'), "'English' (words) button must have active class");
assert(htmlWords.includes("onclick=\"learnTap('words',"), "Rendered cards must contain 'words' items");
assert(!htmlWords.includes("onclick=\"learnTap('letters',"), "Rendered cards must NOT contain 'letters' when filtered by 'words'");
assert(!htmlWords.includes("onclick=\"learnTap('chinese',"), "Rendered cards must NOT contain 'chinese' when filtered by 'words'");
assert(!htmlWords.includes("onclick=\"learnTap('spanish',"), "Rendered cards must NOT contain 'spanish' when filtered by 'words'");
assert(!htmlWords.includes("onclick=\"learnTap('numbers',"), "Rendered cards must NOT contain 'numbers' when filtered by 'words'");
console.log("✓ renderFreeplay() with active category filters cards strictly to that category");

// Test 6: Verify randomness preservation across multiple calls
let shuffleCallCount = 0;
global.shuffle = (arr) => {
    shuffleCallCount++;
    return [...arr].reverse();
};
global.freeplayCategory = 'letters';
renderFreeplay();
assert(shuffleCallCount > 0, 'renderFreeplay must invoke shuffle() on filtered pool');
console.log('✓ Randomness preserved via shuffle() on filtered category item pool');

console.log('\nAll N12 Free Play filter tests PASSED! ✅');
