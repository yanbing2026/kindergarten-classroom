/**
 * Self-test for Grade 2 curriculum activation, grade canonical ID helpers,
 * and standalone grade page redirect bootstrap.
 *
 * Run with: node scripts/test_grade2_curriculum_readiness.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = process.env.KC_ROOT
    ? path.resolve(process.env.KC_ROOT)
    : path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const GRADE_PAGE_BOOTSTRAP = path.join(ROOT_DIR, 'shared/grade-page.js');

console.log('Testing Grade 2 curriculum activation and grade navigation helpers...');

assert(fs.existsSync(INDEX_PATH), `index.html must exist at ${INDEX_PATH}`);
assert(fs.existsSync(GRADE_PAGE_BOOTSTRAP), `grade-page.js must exist at ${GRADE_PAGE_BOOTSTRAP}`);

const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
const gradePageJs = fs.readFileSync(GRADE_PAGE_BOOTSTRAP, 'utf8');

// 1. Verify Grade 2 curriculum ready in index.html
const g2Match = indexHtml.match(/id:\s*'g2'[\s\S]*?courses:\s*\[([\s\S]*?)\]\}/);
assert(g2Match, 'GRADE_CURRICULUM must contain Grade 2');
const g2CoursesRaw = g2Match[1];
const readyCount = (g2CoursesRaw.match(/ready:\s*true/g) || []).length;
assert.strictEqual(readyCount, 5, `Grade 2 must have all 5 courses marked ready: true (found ${readyCount})`);
console.log('✓ Grade 2 has all 5 courses active with ready: true');

// 2. Verify Grade 2 question bank files exist and load cleanly
const g2Files = [
    'data/grade-2/math.js',
    'data/grade-2/ela.js',
    'data/grade-2/science.js',
    'data/grade-2/social-studies.js',
    'data/grade-2/writing.js',
    'data/grade-2/core.js'
];
global.window = {};
for (const f of g2Files) {
    const fullPath = path.join(ROOT_DIR, f);
    assert(fs.existsSync(fullPath), `${f} must exist on disk`);
    require(fullPath);
}
assert(global.window.KC_G2_INTERACTIVE, 'KC_G2_INTERACTIVE must be initialized');
const expectedSubjects = ['math', 'ela', 'science', 'social', 'writing'];
for (const sub of expectedSubjects) {
    const units = global.window.KC_G2_INTERACTIVE[sub];
    assert(Array.isArray(units) && units.length >= 6, `Grade 2 ${sub} must have >= 6 units`);
    for (const u of units) {
        assert(Array.isArray(u.lessons) && u.lessons.length >= 4, `Unit "${u.unit}" in ${sub} must have >= 4 practice questions`);
    }
}
console.log('✓ Grade 2 question bank loaded with 5 subjects and 30 active units');

// 3. Verify gradeCanonicalId and gradeShortId mapping functions
assert(indexHtml.includes('function gradeCanonicalId('), 'index.html must declare gradeCanonicalId helper');
assert(indexHtml.includes('function gradeShortId('), 'index.html must declare gradeShortId helper');

function extractFn(src, name) {
    const start = src.indexOf(`function ${name}(`);
    assert(start !== -1, `function ${name} not found`);
    const open = src.indexOf('{', start);
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') {
            depth--;
            if (depth === 0) return src.slice(start, i + 1);
        }
    }
    throw new Error(`Failed to extract ${name}`);
}

const canonicalIdFn = eval(`(${extractFn(indexHtml, 'gradeCanonicalId')})`);
const shortIdFn = eval(`(${extractFn(indexHtml, 'gradeShortId')})`);

assert.strictEqual(canonicalIdFn('g1'), 'grade-1');
assert.strictEqual(canonicalIdFn('g2'), 'grade-2');
assert.strictEqual(canonicalIdFn('k'), 'kindergarten');
assert.strictEqual(canonicalIdFn('prek'), 'pre-k');
assert.strictEqual(canonicalIdFn('other'), 'other');

assert.strictEqual(shortIdFn('grade-1'), 'g1');
assert.strictEqual(shortIdFn('grade-2'), 'g2');
assert.strictEqual(shortIdFn('kindergarten'), 'k');
assert.strictEqual(shortIdFn('pre-k'), 'prek');
assert.strictEqual(shortIdFn('other'), 'other');
console.log('✓ gradeCanonicalId and gradeShortId mapping verified');

// 4. Verify shared/grade-page.js removes iframe in favor of direct window navigation
assert(!gradePageJs.includes('document.createElement("iframe")') && !gradePageJs.includes("document.createElement('iframe')"),
    'grade-page.js must not create iframes');
assert(gradePageJs.includes('window.location.replace'), 'grade-page.js must use window.location.replace');
console.log('✓ shared/grade-page.js uses native redirection without iframes');

// 5. Verify home hero section title reflects Pre-K to Grade 2
assert(indexHtml.includes('Grades Pre-K–2'), 'index.html must reflect Grades Pre-K–2 in home section title');
console.log('✓ Home section title reflects realistic Pre-K–2 curriculum scope');

console.log('\nAll Grade 2 curriculum and navigation tests PASSED! ✅');
