/**
 * Self-test for answer-position randomness in rendered choice lists.
 *
 * The authored banks under data/ (grade 1, grade 2, kindergarten) and the skill-engine
 * remediation tables
 * all write the correct answer first, and the kindergarten quiz generator only
 * shuffles its own generated choices — so a child could pass by always tapping
 * the top button. The render sites now pass every authored choice list through
 * `shuffle()`. This test proves that:
 *  (1) `shuffle` really permutes and returns a copy;
 *  (2) the clock and bar-chart renderers, given a fixed question, produce
 *      varying answer positions across renders;
 *  (3) every remaining render site (lesson choices, remediation step, transfer
 *      question) wraps its authored choices in `shuffle(...)`.
 *
 * Run with: node scripts/test_choice_order.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

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

const ctx = { Array, Object, String, Math, Number, console };
vm.createContext(ctx);
for (const fn of ['shuffle', 'clockFace', 'gradeInteractiveVisual', 'renderGradeGraph']) {
    vm.runInContext(extractFunction(html, fn), ctx);
}

// (1) shuffle permutes, does not mutate the input
const source = ['a', 'b', 'c', 'd'];
const orders = new Set();
for (let i = 0; i < 200; i++) {
    const out = ctx.shuffle(source);
    assert.notStrictEqual(out, source, 'shuffle must return a copy, not the same array');
    assert.deepStrictEqual([...out].sort(), [...source].sort(), 'shuffle must keep the same elements');
    orders.add(out.join(''));
}
assert(orders.size >= 10, `shuffle produced only ${orders.size} distinct orders in 200 runs`);
assert(JSON.stringify(source) === JSON.stringify(['a', 'b', 'c', 'd']), 'shuffle mutated its input');
console.log(`✓ shuffle: ${orders.size} distinct orders in 200 runs, input untouched`);

// Read the choice order from the click handlers — the button markup itself
// nests spans/SVG, so the label text is not the first child.
function handlerValues(rendered, handler) {
    return [...rendered.matchAll(new RegExp(`${handler}\\('([^']+)'\\)`, 'g'))].map(m => m[1]);
}

// (2a) clock question: four authored choices, answer written first
const clockQuestion = {
    interaction: 'clock',
    clockAnswer: '3:00',
    clockChoices: ['3:00', '7:00', '9:00', '11:00'],
};
const clockOrders = new Set();
for (let i = 0; i < 40; i++) {
    const rendered = ctx.gradeInteractiveVisual(clockQuestion);
    const labels = handlerValues(rendered, 'handleClockChoice');
    assert.deepStrictEqual([...labels].sort(), [...clockQuestion.clockChoices].sort(),
        'clock renderer must still show every choice once');
    clockOrders.add(labels.join('|'));
}
assert(clockOrders.size >= 3, `clock choices rendered in only ${clockOrders.size} distinct orders`);
assert(![...clockOrders].every(o => o.startsWith('3:00')), 'clock answer is always the first button');
console.log(`✓ clock choices: ${clockOrders.size} distinct orders in 40 renders`);

// (2b) bar-chart total question
const graphQuestion = {
    graphLabels: ['Red', 'Blue', 'Green'],
    graphValues: [3, 5, 2],
    graphTotalChoices: ['10', '8', '12', '6'],
    graphTitle: 'Objects in the chart',
    graphMode: 'total',
};
const graphOrders = new Set();
for (let i = 0; i < 40; i++) {
    const rendered = ctx.renderGradeGraph(graphQuestion);
    const labels = handlerValues(rendered, 'handleGraphTotalChoice');
    assert.strictEqual(labels.length, 4, `bar chart must render 4 total choices, saw ${labels.length}`);
    graphOrders.add(labels.join('|'));
}
assert(graphOrders.size >= 3, `bar-chart totals rendered in only ${graphOrders.size} distinct orders`);
assert(![...graphOrders].every(o => o.startsWith('10')), 'bar-chart answer is always the first button');
console.log(`✓ data-bar totals: ${graphOrders.size} distinct orders in 40 renders`);

// (3) the DOM-bound render sites must route authored choices through shuffle
assert(html.includes('const choices=shuffle(q.choices.map('),
    'renderGradeLesson must shuffle the authored lesson choices');
assert(html.includes('shuffle(mini.choices).map('),
    'remediation steps must shuffle the authored choices');
assert(html.includes('shuffle(transfer.choices).map('),
    'transfer questions must shuffle the authored choices');
console.log('✓ lesson / remediation / transfer render sites shuffle their choices');

console.log('\nAll choice-order tests PASSED! ✅');
