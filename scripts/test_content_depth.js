/**
 * Self-test for Grade 1 / Grade 2 content depth and question contracts.
 *
 * Grade 1 used to have four anonymous questions per unit: replaying a unit
 * always showed the same items, and every question shared id ''. This test
 * loads the real data files and asserts the minimum bank size, unique ids,
 * valid answers, and the metadata the adaptive engine reads.
 *
 * Run with: node scripts/test_content_depth.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

function load(files) {
    const window = {};
    const context = vm.createContext({ window, console });
    for (const file of files) {
        const full = path.join(ROOT, file);
        assert(fs.existsSync(full), `missing data file ${file}`);
        vm.runInContext(fs.readFileSync(full, 'utf8'), context, { filename: file });
    }
    return window;
}

function checkBank(label, subjects) {
    const seen = new Set();
    for (const [subject, units] of Object.entries(subjects)) {
        assert(Array.isArray(units) && units.length >= 6, `${label}/${subject} must have at least 6 units`);
        units.forEach((unit, unitIndex) => {
            const questions = unit.lessons || [];
            assert(
                questions.length >= 8,
                `${label}/${subject} unit ${unitIndex + 1} "${unit.unit}" has only ${questions.length} questions (need >= 8)`
            );
            questions.forEach((q, questionIndex) => {
                const where = `${label}/${subject}/${unit.unit}/q${questionIndex + 1}`;
                assert(q.id, `${where}: missing id`);
                assert(!seen.has(q.id), `${where}: duplicate id ${q.id}`);
                seen.add(q.id);
                assert(/^g[12]\.[a-z-]+\.[a-z0-9-]+\.q\d{2}$/.test(q.id), `${where}: unexpected id shape ${q.id}`);
                assert(q.skillId, `${where}: missing skillId`);
                assert.strictEqual(q.subjectKey, subject, `${where}: subjectKey mismatch`);
                assert.strictEqual(q.unitKey, unit.unitKey, `${where}: unitKey mismatch`);
                assert([1, 2, 3, 4, 5].includes(Number(q.difficulty)), `${where}: difficulty out of range`);
                assert(String(q.prompt || '').trim().length >= 8, `${where}: prompt too short`);
                const type = q.type || q.interaction || 'choice';
                if (type === 'sort') {
                    assert(Array.isArray(q.words) && q.words.length > 1, `${where}: sort question needs words`);
                    assert(Array.isArray(q.answer), `${where}: sort answer must be an array`);
                    assert.deepStrictEqual([...q.answer].sort(), [...q.words].sort(), `${where}: sort answer is not a permutation of words`);
                } else if (type === 'text') {
                    assert(Number(q.minWords) > 0, `${where}: text question needs minWords`);
                } else {
                    assert(Array.isArray(q.choices) && q.choices.length >= 2, `${where}: missing choices`);
                    assert(q.choices.includes(q.answer), `${where}: answer "${q.answer}" is not one of the choices`);
                }
                assert(String(q.hint || '').trim().length > 0, `${where}: missing hint`);
                assert(String(q.explanation || '').trim().length > 0, `${where}: missing explanation`);
            });
        });
    }
}

console.log('Testing Grade 1 / Grade 2 content depth...');

// Grade 1: bank + extension + metadata layer, in the same order as index.html.
const g1 = load([
    'data/grade-1/ela.js',
    'data/grade-1/science.js',
    'data/grade-1/social-studies.js',
    'data/grade-1/writing.js',
    'data/grade-1/math.js',
    'data/grade-1/extra.js',
    'data/grade-1/core.js'
]);
assert(g1.KC_G1_CORE, 'grade-1/core.js must export KC_G1_CORE');
checkBank('g1', g1.KC_G1_CORE);
const g1Count = Object.values(g1.KC_G1_CORE).reduce((n, units) => n + units.reduce((m, u) => m + u.lessons.length, 0), 0);
assert(g1Count >= 192, `Grade 1 core subjects should have >= 192 questions, found ${g1Count}`);
console.log(`✓ Grade 1 core subjects: ${g1Count} questions, every unit >= 8, unique ids and valid answers`);

// Grade 1 math is generated in index.html from data/grade-1/math.js.
assert(Array.isArray(g1.KC_G1_MATH) && g1.KC_G1_MATH.length >= 6, 'Grade 1 math bank missing');
g1.KC_G1_MATH.forEach((unit, i) => {
    assert(unit.lessons.length >= 8, `g1/math unit ${i + 1} has only ${unit.lessons.length} questions`);
});
console.log('✓ Grade 1 math: every unit still has at least 8 generated questions');

// Grade 2: all five banks through the metadata build layer.
const g2 = load([
    'data/grade-2/math.js',
    'data/grade-2/ela.js',
    'data/grade-2/science.js',
    'data/grade-2/social-studies.js',
    'data/grade-2/writing.js',
    'data/grade-2/core.js'
]);
assert(g2.KC_G2_INTERACTIVE, 'grade-2/core.js must export KC_G2_INTERACTIVE');
checkBank('g2', g2.KC_G2_INTERACTIVE);
const g2Count = Object.values(g2.KC_G2_INTERACTIVE).reduce((n, units) => n + units.reduce((m, u) => m + u.lessons.length, 0), 0);
assert.strictEqual(g2Count, 900, `Grade 2 should keep 900 questions, found ${g2Count}`);
console.log(`✓ Grade 2: ${g2Count} questions, 30 units, unique ids and valid answers`);

// The extension bank must not silently duplicate an original prompt in the
// same unit (copy/paste regressions are easy here).
for (const [subject, units] of Object.entries(g1.KC_G1_CORE)) {
    units.forEach((unit) => {
        const prompts = new Set();
        unit.lessons.forEach((q) => {
            const key = String(q.prompt).toLowerCase().replace(/\s+/g, ' ').trim();
            assert(!prompts.has(key), `g1/${subject}/${unit.unit}: duplicate prompt "${q.prompt}"`);
            prompts.add(key);
        });
    });
}
console.log('✓ no duplicate prompts within a Grade 1 unit');

// The old Grade 1 math bank was a 21 KB inline literal that was always
// overwritten before first use. It must not come back: the source of truth is
// data/grade-1/math.js, wired through window.KC_G1_MATH.
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert(!html.includes('"unit": "Addition & Subtraction Within 20"'),
    'index.html still contains the dead inline Grade 1 math bank');
assert(/const\s+GRADE1_INTERACTIVE\s*=\s*\{[\s\S]{0,400}?math:\s*window\.KC_G1_MATH/.test(html),
    'GRADE1_INTERACTIVE.math must come from window.KC_G1_MATH');
console.log('✓ Grade 1 math has a single source (data/grade-1/math.js), no dead inline copy');

