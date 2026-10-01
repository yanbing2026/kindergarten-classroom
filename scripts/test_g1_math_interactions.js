/**
 * Self-test for Grade 1 Math interaction semantics (issue #34).
 *
 * Rules verified against the real bank + the real diversifier (both extracted
 * from source, never copied):
 *  (1) Number-line / counting interactions only sit on add-sub questions, and
 *      the number line is long enough to actually hold the answer.
 *  (2) The compare interaction only sits on a question that names two numbers
 *      to compare, and its answer is the greater of that pair.
 *  (3) Data-bar (graph) questions carry bar values that match their prompt and
 *      a total answer equal to the sum of the bars.
 *  (4) No rendered multiple-choice question is unanswerable — the correct
 *      answer must be one of the choices (regression guard for the expanded
 *      form questions, which used to answer with the number while offering
 *      expressions).
 *  (5) Place-value support model: shown only where no interaction owns the
 *      answer, and its tens/ones blocks match the question's value.
 *
 * Run with: node scripts/test_g1_math_interactions.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const bankJs = fs.readFileSync(path.join(ROOT, 'data/grade-1/math.js'), 'utf8');

function extractFunction(source, fnName) {
    const start = source.indexOf(`function ${fnName}(`);
    assert(start !== -1, `Could not find "function ${fnName}(" in index.html`);
    let depth = 0, inString = null, inLine = false, inBlock = false;
    const open = source.indexOf('{', start);
    for (let i = open; i < source.length; i++) {
        const c = source[i], next = source[i + 1];
        if (inLine) { if (c === '\n') inLine = false; continue; }
        if (inBlock) { if (c === '*' && next === '/') { inBlock = false; i++; } continue; }
        if (inString) { if (c === '\\') i++; else if (c === inString) inString = null; continue; }
        if (c === '/' && next === '/') { inLine = true; i++; continue; }
        if (c === '/' && next === '*') { inBlock = true; i++; continue; }
        if (c === '"' || c === "'" || c === '`') { inString = c; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return source.slice(start, i + 1); }
    }
    throw new Error(`Could not find the end of "function ${fnName}("`);
}

// Load the real bank.
const bankCtx = { Array, Object, String, Math, Number };
bankCtx.window = bankCtx;
vm.createContext(bankCtx);
vm.runInContext(bankJs, bankCtx);
const bank = bankCtx.window.KC_G1_MATH;
assert(Array.isArray(bank) && bank.length === 6, 'KC_G1_MATH must be 6 units');

// Run the real diversifier over it (it mutates the bank in place, like the page does).
const diversify = vm.runInContext(
    `(${extractFunction(html, 'diversifyGrade1MathBank')})`,
    vm.createContext({ Array, Object, String, Math, Number, console })
);
const diversified = diversify(bank);

const gradePlaceValueSupport = vm.runInContext(
    `(${extractFunction(html, 'gradePlaceValueSupport')})`,
    vm.createContext({ Array, Object, String, Math, Number })
);

const questions = [];
diversified.forEach((unit, unitIndex) =>
    unit.lessons.forEach((q, i) => questions.push({ unit, unitIndex, i, q })));

const byInteraction = {};
for (const { q } of questions) {
    const kind = q.interaction || `type:${q.type}`;
    byInteraction[kind] = (byInteraction[kind] || 0) + 1;
}
console.log('Interaction mix:', byInteraction, '\n');

let numberlines = 0, counts = 0, compares = 0, dataBars = 0, supported = 0;

for (const { unitIndex, i, q } of questions) {
    const where = `unit ${unitIndex + 1} q${i + 1} (${q.prompt})`;

    // (1) number line + counting only on add/sub prompts, line always covers the answer
    if (q.interaction === 'numberline') {
        numberlines++;
        assert(q.skill === 'add' || q.skill === 'sub', `Number line on a non add-sub prompt: ${where}`);
        assert(Number.isFinite(Number(q.numberlineMax)), `Number line without a finite max: ${where}`);
        assert(Number(q.answer) <= Number(q.numberlineMax),
            `Number line cannot reach the answer (${q.answer} > ${q.numberlineMax}): ${where}`);
    }
    if (q.interaction === 'count') {
        counts++;
        assert(q.skill === 'add' || q.skill === 'sub', `Counting model on a non add-sub prompt: ${where}`);
        assert(Number(q.answer) <= 10, `Counting model with more than 10 objects: ${where}`);
        assert(Number(q.count) === Number(q.answer), `Counting model shows ${q.count} objects for answer ${q.answer}: ${where}`);
    }

    // (2) compare only where two numbers are actually named
    if (q.interaction === 'compare') {
        compares++;
        assert(Array.isArray(q.comparePair) && q.comparePair.length === 2, `Compare interaction without a named pair: ${where}`);
        assert(/greater|less|more/i.test(q.prompt), `Compare interaction on a prompt that is not a comparison: ${where}`);
        assert(Number(q.answer) === Math.max(...q.comparePair.map(Number)),
            `Compare answer is not the greater of the pair: ${where}`);
        assert(Number(q.compareA) !== Number(q.compareB), `Compare shows the same number twice: ${where}`);
    }

    // (3) data bars match the prompt and add up to the answer
    if (Array.isArray(q.dataValues)) {
        dataBars++;
        assert(q.interaction === 'graph', `Read-data question without the bar chart: ${where}`);
        assert(q.graphValues.length === q.graphLabels.length, `Bar labels and values differ in length: ${where}`);
        const nums = (q.prompt.match(/\d+/g) || []).map(Number);
        for (const v of q.graphValues) {
            assert(nums.includes(v), `Bar value ${v} is not in the prompt: ${where}`);
        }
        assert(Number(q.answer) === q.graphValues.reduce((a, b) => a + b, 0),
            `Bar total does not equal the answer: ${where}`);
        assert(q.graphTotalChoices.map(String).includes(String(q.answer)),
            `Bar total choices do not contain the answer: ${where}`);
    }

    // (4) every rendered choice question must be answerable
    if (q.type === 'choice' && !q.interaction) {
        const choices = (q.choices || []).map(String);
        assert(choices.length === 4 || choices.length === 3, `Choice question with ${choices.length} choices: ${where}`);
        assert(new Set(choices).size === choices.length, `Duplicate choices: ${where}`);
        assert(choices.includes(String(q.answer)),
            `Unanswerable: answer "${q.answer}" missing from ${JSON.stringify(choices)} at ${where}`);
    }

    // (5) place-value model: only as scaffolding, and it matches the value
    if (q.placeValue != null) {
        const support = gradePlaceValueSupport(q);
        if (q.interaction) {
            assert(support === '', `Place-value model shown on top of a ${q.interaction} interaction: ${where}`);
        } else {
            supported++;
            const value = Number(q.placeValue);
            const tens = Math.floor(value / 10), ones = value % 10;
            const groups = (support.match(/class="grade-ten-group"/g) || []).length;
            const dots = (support.match(/class="grade-one-dot"/g) || []).length;
            assert(groups === tens, `Model shows ${groups} tens for ${value}: ${where}`);
            assert(dots === ones, `Model shows ${dots} ones for ${value}: ${where}`);
        }
    }
}

// The support model must actually be wired into the lesson renderer, and the
// interactions it sits next to must have their handlers.
assert(html.includes('interaction=gradePlaceValueSupport(q)+interaction;'),
    'renderGradeLesson must prepend the place-value support model');
for (const fn of ['renderGradeGraph', 'handleGraphTotalChoice', 'handleGraphChoice', 'checkTensOnes', 'handleNumberlineChoice']) {
    assert(html.includes(`function ${fn}(`), `Missing handler ${fn} for a Grade 1 math interaction`);
}

// Deliverables of issue #34 must actually exist in the bank.
assert(numberlines >= 3, `Expected number-line questions, found ${numberlines}`);
assert(counts >= 1, `Expected counting questions, found ${counts}`);
assert(compares >= 4, `Expected compare questions on real comparison prompts, found ${compares}`);
assert(dataBars >= 4, `Expected data-bar questions, found ${dataBars}`);
assert(supported >= 4, `Expected place-value support models, found ${supported}`);

console.log(`✓ number-line: ${numberlines} (all add-sub, all reach their answer)`);
console.log(`✓ counting: ${counts} (all ≤ 10 objects)`);
console.log(`✓ compare: ${compares} (all on named pairs)`);
console.log(`✓ data-bar: ${dataBars} (bars match the prompt, totals match)`);
console.log(`✓ place-value model: ${supported} questions`);
console.log('✓ every multiple-choice question is answerable');
console.log('\nAll Grade 1 math interaction tests PASSED! ✅');
