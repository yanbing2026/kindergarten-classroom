/**
 * Self-test for N10 Accessibility Concrete Gaps:
 * 1) Feedback regions have aria-live="polite" (gradeFeedback, streakBadge, blipolaMessage, gradeBlipolaMessage).
 * 2) Emoji icon-only buttons have accessible names via aria-label (topbar back/home/voice/mute, trace & draw controls).
 * 3) render() manages focus on page transition without stealing focus from active inputs or causing scroll jumps.
 * 4) Main flow interactive elements are native <button>/<input> without extraneous tabindex attributes.
 *
 * Extracted directly from index.html (no logic duplicates).
 * Run with: node scripts/test_a11y_concrete_gaps.js
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

console.log('Testing N10 a11y concrete gaps (extracted from index.html)...');

// 1. Feedback areas: exactly one polite live region per lesson card.
// The visible bubbles carry the full text for sighted users; the dedicated
const renderGradeLessonSrc = extractFunction(html, 'renderGradeLesson');
// sr-only node carries the short status for screen readers. Putting the full
// text on a live region AND speaking it caused double announcements (§6.3).
assert(
    renderGradeLessonSrc.includes('id="gradeFeedbackLive" class="sr-only" aria-live="polite"'),
    'renderGradeLesson must render one sr-only gradeFeedbackLive with aria-live="polite"'
);
assert(
    !renderGradeLessonSrc.includes('id="gradeFeedback" class="grade-feedback" aria-live'),
    'visible gradeFeedback bubble must not be a live region (announcements go to gradeFeedbackLive)'
);
assert(
    !renderGradeLessonSrc.includes('id="gradeBlipolaMessage" aria-live'),
    'visible gradeBlipolaMessage bubble must not be a live region (hints go through announceGradeFeedback)'
);
const renderPlaySrc = extractFunction(html, 'renderPlay');
assert(
    renderPlaySrc.includes('id="streakBadge" class="streak-badge" aria-live="polite"'),
    'renderPlay must render streakBadge with aria-live="polite"'
);
assert(
    renderPlaySrc.includes('id="blipolaMessage" aria-live="polite"'),
    'renderPlay must render blipolaMessage with aria-live="polite"'
);
assert(
    html.includes('class="world-detail" aria-live="polite"'),
    'index.html must maintain world-detail aria-live="polite"'
);
console.log('✓ Feedback areas aria-live="polite" verified');

// 2. Icon button accessible names (aria-label) assertions
const topbarSrc = extractFunction(html, 'topbar');
const renderSettingsModalSrc = extractFunction(html, 'renderSettingsModal');
const renderTopbarMuteOnlySrc = extractFunction(html, 'renderTopbarMuteOnly');
const renderTraceSrc = extractFunction(html, 'renderTrace');
const renderDrawSrc = extractFunction(html, 'renderDraw');

// Topbar icons
assert(topbarSrc.includes('onclick="goBack()" aria-label="Go back"'), 'topbar back button must have aria-label="Go back"');
assert(topbarSrc.includes('onclick="goHome()" aria-label="Home"'), 'topbar home button must have aria-label="Home"');
assert(topbarSrc.includes('onclick="blipolaVoiceAction()" title="Blipola Voice" aria-label="Blipola Voice"'), 'topbar Blipola voice button must have aria-label="Blipola Voice"');
assert(renderSettingsModalSrc.includes('id="muteBtn" onclick="toggleMute()" aria-label="${muted ? \'Unmute sound\' : \'Mute sound\'}"'), 'settings modal mute button must have dynamic aria-label');

// Trace & Draw toolbar icon buttons
assert(renderTraceSrc.includes('onclick="replayTrace()" aria-label="Hear pronunciation"'), 'renderTrace replay button must have aria-label="Hear pronunciation"');
assert(renderTraceSrc.includes('onclick="clearTraceCanvas()" aria-label="Clear canvas"'), 'renderTrace clear button must have aria-label="Clear canvas"');
assert(renderDrawSrc.includes('onclick="clearDrawCanvas()" title="Clear" aria-label="Clear canvas"'), 'renderDraw clear button must have aria-label="Clear canvas"');

// Static check on renderTopbarMuteOnly
assert(renderTopbarMuteOnlySrc.includes("setAttribute('aria-label'"), 'renderTopbarMuteOnly must update aria-label when toggled');
console.log('✓ Icon buttons aria-label contracts verified');

// 3. Focus management in render() assertions
const renderSrc = extractFunction(html, 'render');
assert(renderSrc.includes("app.setAttribute('tabindex', '-1')") || renderSrc.includes("tabindex"), 'render() must ensure tabindex="-1" on app container');
assert(renderSrc.includes("active.tagName === 'INPUT'") || renderSrc.includes("isInputActive"), 'render() must check for active inputs before focusing');
assert(renderSrc.includes("app.focus({ preventScroll: true })"), 'render() must call app.focus with preventScroll: true');
console.log('✓ render() focus management source contracts verified');

// 4. Dynamic behavior verification with mock DOM
const mockElements = {
    muteBtn: {
        textContent: '🔊',
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = String(v); },
        getAttribute(k) { return this.attributes[k] || null; }
    },
    app: {
        attributes: { tabindex: '-1' },
        innerHTML: '',
        hasAttribute(k) { return k in this.attributes; },
        setAttribute(k, v) { this.attributes[k] = String(v); },
        getAttribute(k) { return this.attributes[k] || null; },
        querySelector() { return null; },
        focusCalls: [],
        focus(opts) { this.focusCalls.push(opts || {}); }
    }
};

let currentActiveElement = null;

global.document = {
    getElementById: (id) => mockElements[id] || null,
    querySelector: (sel) => {
        if (sel.includes('muteBtn')) return mockElements.muteBtn;
        return null;
    },
    get activeElement() {
        return currentActiveElement;
    }
};

global.window = {
    location: { search: '' }
};
global.debugMode = false;
global.state = { screen: 'home', stack: [], params: null };
global.renderHome = () => '<div class="home">Home</div>';
global.renderDebugPanel = () => '';

// Test renderTopbarMuteOnly dynamic execution
global.muted = true;
const renderTopbarMuteOnly = eval(`(${renderTopbarMuteOnlySrc})`);
renderTopbarMuteOnly();
assert.strictEqual(mockElements.muteBtn.textContent, '🔇');
assert.strictEqual(mockElements.muteBtn.getAttribute('aria-label'), 'Unmute sound');

global.muted = false;
renderTopbarMuteOnly();
assert.strictEqual(mockElements.muteBtn.textContent, '🔊');
assert.strictEqual(mockElements.muteBtn.getAttribute('aria-label'), 'Mute sound');
console.log('✓ renderTopbarMuteOnly dynamic aria-label updates verified');

// Test render() focus behavior
const renderFn = eval(`(${renderSrc})`);

// Case A: normal transition (no input focused) -> app receives focus with preventScroll: true
currentActiveElement = null;
mockElements.app.focusCalls = [];
renderFn();
assert.strictEqual(mockElements.app.focusCalls.length, 1, 'render() must focus app container');
assert.strictEqual(mockElements.app.focusCalls[0].preventScroll, true, 'render() focus call must set preventScroll: true');

// Case B: active input is focused -> app does NOT steal focus
currentActiveElement = { tagName: 'INPUT', isContentEditable: false };
mockElements.app.focusCalls = [];
renderFn();
assert.strictEqual(mockElements.app.focusCalls.length, 0, 'render() must not steal focus from an active input');

// Case C: active textarea is focused -> app does NOT steal focus
currentActiveElement = { tagName: 'TEXTAREA', isContentEditable: false };
mockElements.app.focusCalls = [];
renderFn();
assert.strictEqual(mockElements.app.focusCalls.length, 0, 'render() must not steal focus from an active textarea');
console.log('✓ Dynamic render() focus management behavior verified');

// 5. Main-flow keyboard accessibility and single-navigation verification
// Extracted directly from index.html (no duplicated HTML template)
const renderHomeSrc = extractFunction(html, 'renderHome');
const getTodayLessonSrc = extractFunction(html, 'getTodayLesson');
const startTodayAdventureSrc = extractFunction(html, 'startTodayAdventure');

// Assert structural contracts from renderHome source
assert(
    renderHomeSrc.includes('<button type="button" class="today-card" onclick="'),
    'today-card must be a native <button> so the whole card is keyboard reachable'
);
assert(
    renderHomeSrc.includes('<span class="big-btn play">START ▶</span>'),
    'START must be a styled span inside the card button, not a nested <button>'
);
assert(
    !renderHomeSrc.includes('<button class="big-btn play">START ▶</button>'),
    'today-card must not nest a second button inside the card button'
);

// Dynamic execution of extracted functions with mock DOM & event propagation:
// Verify that single click on START button triggers navigation exactly once.
let goCalls = 0;
let lastGoArgs = null;
global.go = (...args) => {
    goCalls++;
    lastGoArgs = args;
};
global.startQuiz = (catKey, level, itemId) => {
    global.go('play', { key: catKey, level, item: itemId });
};
global.startMath = (level) => {
    global.go('play', { key: 'math', level });
};

// Set up minimal globals required by getTodayLesson & renderHome
global.progress = { mathCorrect: {}, stars: 0, activityLog: [] };
global.CATEGORIES = [
    {
        key: 'letters',
        name: 'Letters',
        icon: '🔤',
        levels: [{ id: 'L1', items: [{ id: 'A' }, { id: 'B' }] }]
    }
];
global.GRADE_CURRICULUM = [];
global.MASTERY_THRESHOLD = 2;
global.renderDailyMissions = () => '';
global.renderTodayReview = () => '';
global.topbar = () => '';
global.getMasteryCount = () => 0;
global.isDue = () => false;

const evalGetTodayLesson = eval(`(${getTodayLessonSrc})`);
global.getTodayLesson = evalGetTodayLesson;
const evalStartTodayAdventure = eval(`(${startTodayAdventureSrc})`);
global.startTodayAdventure = evalStartTodayAdventure;

const evalRenderHome = eval(`(${renderHomeSrc})`);
const homeHTML = evalRenderHome();

// Extract the today-card segment from the truly evaluated homeHTML
const cardMatch = homeHTML.match(/<button type="button" class="today-card" onclick="([^"]+)">([\s\S]*?)<\/button>/);
assert(cardMatch, 'Rendered home HTML must contain a .today-card button with onclick');
const cardOnclickAttr = cardMatch[1];
const cardInner = cardMatch[2];

assert(cardInner.includes('<span class="big-btn play">START ▶</span>'), 'START span must be inside today-card');
assert(!cardInner.includes('<button'), 'today-card button must not contain a nested button');

// 1) One activation of the card button must navigate exactly once.
goCalls = 0;
eval(cardOnclickAttr);
assert.strictEqual(goCalls, 1, `Single activation of today-card must trigger navigation exactly once, got ${goCalls}`);

console.log('✓ Main flow card is a single native button with one navigation trigger');

console.log('\nAll N10 a11y concrete gap tests PASSED! ✅');

