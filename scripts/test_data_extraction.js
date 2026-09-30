/**
 * Self-test for N3 data extraction:
 * 1. Verifies that kindergarten content constants have been extracted out of
 *    inline script blocks in index.html into data/kindergarten/content.js.
 * 2. Asserts that all extracted constants exist as top-level const in content.js.
 * 3. Asserts that index.html loads content.js via <script src> prior to the main inline script.
 * 4. Asserts that content.js evaluates correctly and provides expected data structures.
 *
 * Run with: node scripts/test_data_extraction.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const CONTENT_PATH = path.join(ROOT_DIR, 'data/kindergarten/content.js');

console.log('Testing N3 data extraction from index.html to content.js...');

assert(fs.existsSync(INDEX_PATH), 'index.html must exist');
assert(fs.existsSync(CONTENT_PATH), 'data/kindergarten/content.js must exist');

const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
const contentJs = fs.readFileSync(CONTENT_PATH, 'utf8');

// 1. Core required constants list
const PRIMARY_CONSTANTS = [
    'LETTERS',
    'NUMBERS',
    'VOCAB_LEVELS',
    'MATH_LEVELS',
    'SCIENCE_LEVELS',
    'SCIENCE_LEVELS_MAPPED',
    'CATEGORIES',
    'TRACE_CATEGORIES'
];

const ALL_EXTRACTED_CONSTANTS = [
    'LEVEL_ICONS',
    'LETTERS',
    'NUMBERS',
    'VOCAB_LEVELS',
    'WORDS_LEVELS',
    'CHINESE_LEVELS',
    'SPANISH_LEVELS',
    'MATH_LEVELS',
    'SCIENCE_LEVELS',
    'SCIENCE_LEVELS_MAPPED',
    'PATTERNS_LEVELS',
    'COMPARING_LEVELS',
    'POSITIONS_LEVELS',
    'MEASUREMENT_LEVELS',
    'TIME_LEVELS',
    'MONEY_LEVELS',
    'ONEMORELESS_LEVELS',
    'RHYMING_LEVELS',
    'SIGHTWORDS_LEVELS',
    'MAKE10_LEVELS',
    'DECOMPOSE_LEVELS',
    'TEEN_NUMBERS_LEVELS',
    'SORT_CLASSIFY_LEVELS',
    'SHAPES3D_LEVELS',
    'PRINT_CONCEPTS_LEVELS',
    'BEGIN_END_SOUNDS_LEVELS',
    'SENTENCES_LEVELS',
    'PREPOSITIONS_LEVELS',
    'SORT_CATEGORY_LEVELS',
    'PATTERNS_MAPPED',
    'COMPARING_MAPPED',
    'POSITIONS_MAPPED',
    'MEASUREMENT_MAPPED',
    'TIME_MAPPED',
    'MONEY_MAPPED',
    'ONEMORELESS_MAPPED',
    'RHYMING_MAPPED',
    'SIGHTWORDS_MAPPED',
    'MAKE10_MAPPED',
    'DECOMPOSE_MAPPED',
    'TEEN_NUMBERS_MAPPED',
    'SORT_CLASSIFY_MAPPED',
    'SHAPES3D_MAPPED',
    'PRINT_CONCEPTS_MAPPED',
    'BEGIN_END_SOUNDS_MAPPED',
    'SENTENCES_MAPPED',
    'PREPOSITIONS_MAPPED',
    'SORT_CATEGORY_MAPPED',
    'CATEGORIES',
    'TRACE_CATEGORIES'
];

// 2. Extract inline script blocks from index.html
const inlineScriptMatches = [...indexHtml.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)];
assert(inlineScriptMatches.length >= 2, 'Expected at least 2 inline script blocks in index.html');
const inlineCode = inlineScriptMatches.map(m => m[1]).join('\n\n');

// 3. Assert none of the extracted constants are declared in inline scripts
for (const c of ALL_EXTRACTED_CONSTANTS) {
    const declRegex = new RegExp(`(?:const|let|var)\\s+${c}\\s*=`);
    assert(
        !declRegex.test(inlineCode),
        `Constant "${c}" must NO LONGER be declared in index.html inline script blocks`
    );
}
console.log(`✓ All ${ALL_EXTRACTED_CONSTANTS.length} constants successfully removed from index.html inline scripts.`);

// 4. Assert all extracted constants exist as top-level const in content.js
for (const c of ALL_EXTRACTED_CONSTANTS) {
    const constRegex = new RegExp(`(?:^|\\n)\\s*const\\s+${c}\\s*=`);
    assert(
        constRegex.test(contentJs),
        `Top-level const "${c}" must be declared in data/kindergarten/content.js`
    );
}
console.log(`✓ All ${ALL_EXTRACTED_CONSTANTS.length} constants confirmed as top-level const in content.js.`);

// 5. Assert content.js is NOT wrapped in an IIFE
assert(
    !/^\s*\(\s*function\s*\(\s*\)\s*\{/m.test(contentJs),
    'content.js must not be wrapped in an IIFE (constants must be top-level global)'
);
console.log('✓ content.js verified to declare top-level global constants without IIFE encapsulation.');

// 6. Assert script loading order in index.html
const contentScriptTagMatch = indexHtml.match(/<script\s+[^>]*src=["'](?:(?:\.\/)?data\/kindergarten\/content\.js)["'][^>]*><\/script>/i);
assert(contentScriptTagMatch, 'index.html must include <script src="data/kindergarten/content.js"></script>');

const contentScriptPos = contentScriptTagMatch.index;

// Locate the main inline script (which encloses APP_VERSION)
const appVerPos = indexHtml.indexOf('const APP_VERSION');
assert(appVerPos !== -1, 'Could not locate const APP_VERSION in index.html');
const mainInlineScriptPos = indexHtml.lastIndexOf('<script', appVerPos);
assert(mainInlineScriptPos !== -1, 'Could not locate main inline script tag enclosing APP_VERSION');

assert(
    contentScriptPos < mainInlineScriptPos,
    `content.js script tag (offset ${contentScriptPos}) must appear before main inline script (offset ${mainInlineScriptPos})`
);
console.log('✓ Script tag loading order verified: content.js loads synchronously before the main inline script.');

// 7. Verify VM evaluation and data integrity of content.js
const ctx = { Array, Object, String, Math };
vm.createContext(ctx);
const exportExpression = `\n;({ ${ALL_EXTRACTED_CONSTANTS.join(', ')} });`;
const evaluated = vm.runInContext(contentJs + exportExpression, ctx);

assert(Array.isArray(evaluated.LETTERS) && evaluated.LETTERS.length === 26, 'LETTERS must be an array of 26 letters');
assert(Array.isArray(evaluated.NUMBERS) && evaluated.NUMBERS.length === 20, 'NUMBERS must be an array of 20 numbers');
assert(Array.isArray(evaluated.VOCAB_LEVELS) && evaluated.VOCAB_LEVELS.length === 10, 'VOCAB_LEVELS must have 10 levels');
assert(Array.isArray(evaluated.MATH_LEVELS) && evaluated.MATH_LEVELS.length === 10, 'MATH_LEVELS must have 10 levels');
assert(Array.isArray(evaluated.SCIENCE_LEVELS) && evaluated.SCIENCE_LEVELS.length === 12, 'SCIENCE_LEVELS must have 12 levels');
assert(Array.isArray(evaluated.SCIENCE_LEVELS_MAPPED) && evaluated.SCIENCE_LEVELS_MAPPED.length === 12, 'SCIENCE_LEVELS_MAPPED must have 12 levels');
assert(Array.isArray(evaluated.CATEGORIES) && evaluated.CATEGORIES.length === 26, 'CATEGORIES must have 26 categories');
assert(Array.isArray(evaluated.TRACE_CATEGORIES) && evaluated.TRACE_CATEGORIES.length === 5, 'TRACE_CATEGORIES must have 5 categories');

console.log('✓ Evaluated content.js in isolated VM and validated all data structures.');
console.log('\nAll N3 data extraction tests PASSED! ✅');
