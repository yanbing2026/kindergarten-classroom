/**
 * Self-test for HTML structure and tag nesting:
 * Verifies that main screens render validly nested HTML (div/button/span/a/li/ul/h2/h3/p),
 * that no closing tags mismatch their innermost open tag, that no unclosed tags remain,
 * that no <button> opens while a button is already open, and that zero <div onclick=> exist.
 *
 * Run with: node scripts/test_html_structure.js
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

// 1. Setup minimal harness and stubs
global.APP_VERSION = 'v2-test';
global.muted = false;
global.debugMode = false;
global.state = { screen: 'home', stack: [], params: null };
global.go = (screen, params) => {
    global.state.screen = screen;
    global.state.params = params || null;
};
global.progress = { mathCorrect: {}, stars: 12, activityLog: [] };
global.CATEGORIES = [
    {
        key: 'letters',
        name: 'Letters',
        icon: '🔤',
        leveled: true,
        levels: [{ id: 'L1', label: 'Level 1', icon: '🔤', items: [{ id: 'A', word: 'Apple' }, { id: 'B', word: 'Ball' }] }]
    },
    {
        key: 'numbers',
        name: 'Numbers',
        icon: '🔢',
        leveled: false,
        levels: [{ id: 'L1', label: 'Numbers', icon: '🔢', items: [{ id: '1', n: '1' }] }]
    }
];
global.GRADE_CURRICULUM = [
    {
        id: 'k',
        label: 'Kindergarten',
        icon: '🌱',
        subtitle: 'Foundations',
        courses: [
            { name: 'Reading', icon: '📖', desc: 'Alphabet & phonics', ready: true, key: 'letters' },
            { name: 'Math Foundations', icon: '🔢', desc: 'Numbers & counting', ready: false }
        ]
    }
];
global.GRADE_PAGE_SHELL = false;
global.DRAW_COLORS = [{ hex: '#000000', name: 'Black' }, { hex: '#e74c3c', name: 'Red' }];
global.DRAW_SIZES = [4, 8, 16];
global.drawColor = '#000000';
global.drawSize = 8;
global.drawEraser = false;
global.TRACE_COLORS = [{ hex: '#e74c3c', name: 'Red' }, { hex: '#3498db', name: 'Blue' }];
global.traceColor = '#e74c3c';
global.ROUND_LENGTH = 5;

global.MASTERY_THRESHOLD = 2;
global.getMasteryCount = () => 0;
global.freeplayCategory = 'all';
global.filterFreeplayItems = (groups, cat) => groups;
global.getTodayLesson = () => ({
    cat: global.CATEGORIES[0],
    item: { id: 'A', word: 'Apple' },
    reason: 'Next in sequence'
});
global.startTodayAdventure = () => {};
global.renderDailyMissions = () => '<div class="daily-missions">Missions</div>';
global.renderTodayReview = () => '<div class="today-review">Review</div>';
global.categoryMasteredCount = () => 0;
global.gradeInteractiveKey = () => null;
global.getCategoryItems = (k, l) => [{ id: 'A', word: 'Apple' }, { id: 'B', word: 'Ball' }];
global.isMastered = () => false;
global.shuffle = (arr) => arr.slice();
global.esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
global.getTraceText = (k, item) => (item ? item.id : 'A');
global.traceFontSize = () => '4rem';

// Extract render functions directly from index.html
const topbarSrc = extractFunction(html, 'topbar');
const renderHomeSrc = extractFunction(html, 'renderHome');
const renderLevelPickerSrc = extractFunction(html, 'renderLevelPicker');
const renderGradesSrc = extractFunction(html, 'renderGrades');
const renderLearnSrc = extractFunction(html, 'renderLearn');
const renderDrawSrc = extractFunction(html, 'renderDraw');
const startTraceSrc = extractFunction(html, 'startTrace');
const renderTraceSrc = extractFunction(html, 'renderTrace');
const renderFreeplaySrc = extractFunction(html, 'renderFreeplay');

global.topbar = eval(`(${topbarSrc})`);
const renderHome = eval(`(${renderHomeSrc})`);
const renderLevelPicker = eval(`(${renderLevelPickerSrc})`);
const renderGrades = eval(`(${renderGradesSrc})`);
const renderLearn = eval(`(${renderLearnSrc})`);
const renderDraw = eval(`(${renderDrawSrc})`);
const startTrace = eval(`(${startTraceSrc})`);
const renderTrace = eval(`(${renderTraceSrc})`);
const renderFreeplay = eval(`(${renderFreeplaySrc})`);

// 2. Stack-based HTML tag matcher
function checkHtmlStructure(screenName, htmlString, silent = false) {
    const trackedTags = new Set(['div', 'button', 'span', 'a', 'li', 'ul', 'h2', 'h3', 'p']);
    const stack = [];
    const tagRegex = /<(\/?)([a-zA-Z0-9]+)((?:\s+[^>]*?)?)\s*(\/?)>/g;
    let match;

    while ((match = tagRegex.exec(htmlString)) !== null) {
        const isClosing = match[1] === '/';
        const tag = match[2].toLowerCase();
        const attrs = match[3] || '';
        const isSelfClosing = match[4] === '/' || attrs.trim().endsWith('/');

        const tagIndex = match.index;
        const surroundingStart = Math.max(0, tagIndex - 40);
        const surroundingEnd = Math.min(htmlString.length, tagIndex + match[0].length + 40);
        const snippet = htmlString.slice(surroundingStart, surroundingEnd);

        if (!isClosing) {
            // Interactive nesting rule: while a button is open, no button, a[href], input, select, textarea may open
            const isButtonOpen = stack.some(e => e.tag === 'button');
            const isInteractive = tag === 'button' ||
                (tag === 'a' && /\bhref\s*=/i.test(attrs)) ||
                tag === 'input' ||
                tag === 'select' ||
                tag === 'textarea';

            if (isButtonOpen && isInteractive) {
                if (!silent) {
                    console.error(`\nHTML STRUCTURE ERROR in screen "${screenName}":`);
                    console.error(`Interactive element <${tag}> cannot open while a <button> is already open!`);
                    console.error(`Offending tag: ${match[0]}`);
                    console.error(`Surrounding markup: ...${snippet}...\n`);
                }
                assert.fail(`[${screenName}] Interactive element <${tag}> opened while <button> is already open: ${match[0]}`);
            }
        }

        if (!trackedTags.has(tag)) {
            continue;
        }

        if (isSelfClosing) {
            continue;
        }

        if (isClosing) {
            if (stack.length === 0) {
                if (!silent) {
                    console.error(`\nHTML STRUCTURE ERROR in screen "${screenName}":`);
                    console.error(`Unexpected closing tag </${tag}> with no matching open tag on stack.`);
                    console.error(`Surrounding markup: ...${snippet}...\n`);
                }
                assert.fail(`[${screenName}] Unexpected closing tag </${tag}>`);
            }
            const top = stack.pop();
            if (top.tag !== tag) {
                if (!silent) {
                    console.error(`\nHTML STRUCTURE ERROR in screen "${screenName}":`);
                    console.error(`Closing tag </${tag}> does not match innermost open tag <${top.tag}> (opened at index ${top.index}).`);
                    console.error(`Surrounding markup: ...${snippet}...\n`);
                }
                assert.fail(`[${screenName}] Closing tag mismatch: expected </${top.tag}>, got </${tag}>`);
            }
        } else {
            stack.push({ tag, attrs, index: tagIndex, raw: match[0] });
        }
    }

    if (stack.length > 0) {
        const unclosed = stack.map(e => `<${e.tag}>`).join(', ');
        const firstUnclosed = stack[0];
        const snippet = htmlString.slice(Math.max(0, firstUnclosed.index - 40), Math.min(htmlString.length, firstUnclosed.index + 80));
        if (!silent) {
            console.error(`\nHTML STRUCTURE ERROR in screen "${screenName}":`);
            console.error(`Unclosed tags remaining at end of screen: ${unclosed}`);
            console.error(`First unclosed tag markup: ...${snippet}...\n`);
        }
        assert.fail(`[${screenName}] Unclosed tags remaining: ${unclosed}`);
    }
}

// Rule: Every <div onclick> must be the today-card tile
function checkDivOnclickExemption(contextName, text, silent = false) {
    const divOnclickRegex = /<div\b[^>]*\bonclick=[^>]*>/gi;
    let match;
    while ((match = divOnclickRegex.exec(text)) !== null) {
        const tag = match[0];
        if (!tag.includes('today-card')) {
            if (!silent) {
                console.error(`\nHTML CHECK ERROR in ${contextName}:`);
                console.error(`Disallowed <div onclick=> found: ${tag}`);
                console.error(`Tile divs must be converted to <button type="button"> unless they contain another interactive element.`);
            }
            assert.fail(`[${contextName}] Disallowed <div onclick=> found: ${tag}. Tile divs must be converted to <button type="button"> unless they contain another interactive element.`);
        }
    }
}

// Self-test tag matcher against known malformed structures
assert.throws(() => checkHtmlStructure('test_mismatch', '<div><span></div></span>', true));
assert.throws(() => checkHtmlStructure('test_unclosed', '<div>', true));
assert.throws(() => checkHtmlStructure('test_unexpected', '</div>', true));
assert.throws(() => checkHtmlStructure('test_nested_button', '<button class="card"><button class="card">btn</button></button>', true));
assert.throws(() => checkHtmlStructure('test_nested_input', '<button><input type="text"></button>', true));
assert.throws(() => checkHtmlStructure('test_nested_link', '<button><a href="/test">link</a></button>', true));
assert.throws(() => checkDivOnclickExemption('test_disallowed_div_onclick', '<div class="card" onclick="go()">Card</div>', true));

// 3. Render and test screens
const screens = [];

// Screen 1: home
global.state.screen = 'home';
global.state.params = null;
screens.push({ name: 'home', html: renderHome() });

// Screen 2: level picker
global.state.screen = 'category';
global.state.params = { key: 'letters' };
screens.push({ name: 'levelPicker', html: renderLevelPicker() });

// Screen 3: grade courses
global.state.screen = 'grades';
global.state.params = { grade: 'k' };
screens.push({ name: 'gradeCourses', html: renderGrades() });

// Screen 4: lesson list (learn)
global.state.screen = 'learn';
global.state.params = { key: 'letters', level: 'L1' };
screens.push({ name: 'lessonList', html: renderLearn() });

// Screen 5: draw
global.state.screen = 'draw';
global.state.params = null;
screens.push({ name: 'draw', html: renderDraw() });

// Screen 6: trace
startTrace('letters', 'L1');
screens.push({ name: 'trace', html: renderTrace() });

// Screen 7: freeplay
global.state.screen = 'freeplay';
global.state.params = null;
screens.push({ name: 'freeplay', html: renderFreeplay() });

console.log(`Checking HTML structure for ${screens.length} screens...`);

for (const { name, html: screenHtml } of screens) {
    assert(typeof screenHtml === 'string' && screenHtml.length > 0, `Screen "${name}" rendered empty HTML`);
    checkHtmlStructure(name, screenHtml);
    checkDivOnclickExemption(`screen "${name}"`, screenHtml);
    console.log(`✓ Screen "${name}" passed structure verification`);
}

// 4. File-level check: every <div onclick> in index.html must be the today-card tile
const fileDivOnclicks = html.match(/<div\b[^>]*\bonclick=[^>]*>/gi) || [];
console.log(`Found ${fileDivOnclicks.length} <div onclick=> element(s) in index.html (today-card exemption)`);
checkDivOnclickExemption('index.html', html);

console.log('PASSED: All screens have valid HTML structure and tag nesting');
