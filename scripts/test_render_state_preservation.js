/**
 * Self-test for N9 render state preservation:
 * Verifies that high-frequency interactions (topbar mute toggle, Blipola voice unmute,
 * star awards, and in-progress grade sentence sorting) perform targeted DOM updates
 * via getElementById without triggering destructive full-page render() calls.
 *
 * Run with: node scripts/test_render_state_preservation.js
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

// 1. Extract functions directly from index.html
const renderTopbarMuteOnlySrc = extractFunction(html, 'renderTopbarMuteOnly');
const toggleMuteSrc = extractFunction(html, 'toggleMute');
const blipolaVoiceActionSrc = extractFunction(html, 'blipolaVoiceAction');
const renderTopbarStarsOnlySrc = extractFunction(html, 'renderTopbarStarsOnly');
const awardStarSrc = extractFunction(html, 'awardStar');
const renderGradeSortHTMLSrc = extractFunction(html, 'renderGradeSortHTML');
const renderGradeSortOnlySrc = extractFunction(html, 'renderGradeSortOnly');
const handleGradeSortChoiceSrc = extractFunction(html, 'handleGradeSortChoice');
const resetGradeSortSrc = extractFunction(html, 'resetGradeSort');

console.log('Testing N9 render state preservation (extracted from index.html)...');

// 2. Static source contract assertions
assert(!toggleMuteSrc.includes('render()'), 'toggleMute must not invoke full render()');
assert(toggleMuteSrc.includes('renderTopbarMuteOnly()'), 'toggleMute must call renderTopbarMuteOnly()');

assert(!blipolaVoiceActionSrc.includes('render()'), 'blipolaVoiceAction must not invoke full render()');
assert(blipolaVoiceActionSrc.includes('renderTopbarMuteOnly()'), 'blipolaVoiceAction must call renderTopbarMuteOnly()');

assert(awardStarSrc.includes('renderTopbarStarsOnly()'), 'awardStar must call renderTopbarStarsOnly()');
assert(!awardStarSrc.includes('render()'), 'awardStar must not invoke full render()');

assert(handleGradeSortChoiceSrc.includes('renderGradeSortOnly()'), 'handleGradeSortChoice must use renderGradeSortOnly()');
assert(resetGradeSortSrc.includes('renderGradeSortOnly()'), 'resetGradeSort must use renderGradeSortOnly()');
console.log('✓ Static extraction contracts verified');

// 3. Dynamic behavior tests
// Mock minimal DOM & environment
const mockStorage = {};
global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
};

let renderCallCount = 0;
global.render = () => { renderCallCount++; };

const mockElements = {};
global.document = {
    getElementById: (id) => mockElements[id] || null,
    querySelector: (sel) => {
        if (sel.includes('muteBtn') || sel.includes('toggleMute')) return mockElements['muteBtn'] || null;
        if (sel.includes('star-badge')) return mockElements['topbarStarBadge'] || null;
        return null;
    },
};

global.window = global;
global.APP_VERSION = 'v2-20260930-n9';
global.muted = false;
global.progress = { stars: 5 };
global.saveProgress = () => {};
global.getWorldStage = () => ({ index: 1 });
global.mcWorldUnlockBurst = () => {};
global.stopAllAudio = () => {};
global.speak = () => {};
global.esc = (s) => String(s);

// Evaluate extracted functions in scope
const renderTopbarMuteOnly = eval(`(${renderTopbarMuteOnlySrc})`);
const toggleMute = eval(`(${toggleMuteSrc})`);
const blipolaVoiceAction = eval(`(${blipolaVoiceActionSrc})`);
const renderTopbarStarsOnly = eval(`(${renderTopbarStarsOnlySrc})`);
const awardStar = eval(`(${awardStarSrc})`);
const renderGradeSortHTML = eval(`(${renderGradeSortHTMLSrc})`);
const renderGradeSortOnly = eval(`(${renderGradeSortOnlySrc})`);

// Test 1: renderTopbarMuteOnly updates mute button without full render
const muteBtn = { textContent: '🔊' };
mockElements['muteBtn'] = muteBtn;

global.muted = true;
renderTopbarMuteOnly();
assert.strictEqual(muteBtn.textContent, '🔇', 'Mute button text should update to 🔇 when muted is true');
assert.strictEqual(renderCallCount, 0, 'render() must not be called by renderTopbarMuteOnly()');

global.muted = false;
renderTopbarMuteOnly();
assert.strictEqual(muteBtn.textContent, '🔊', 'Mute button text should update to 🔊 when muted is false');
assert.strictEqual(renderCallCount, 0, 'render() must not be called by renderTopbarMuteOnly()');
console.log('✓ renderTopbarMuteOnly updates DOM button directly');

// Test 2: toggleMute flips state, stores to localStorage, updates button, no render()
toggleMute();
assert.strictEqual(global.muted, true, 'toggleMute should set muted to true');
assert.strictEqual(mockStorage['kc_muted'], '1', 'localStorage kc_muted should be 1');
assert.strictEqual(muteBtn.textContent, '🔇', 'Mute button should reflect muted state');
assert.strictEqual(renderCallCount, 0, 'toggleMute must not trigger full render()');

toggleMute();
assert.strictEqual(global.muted, false, 'toggleMute should set muted back to false');
assert.strictEqual(mockStorage['kc_muted'], '0', 'localStorage kc_muted should be 0');
assert.strictEqual(muteBtn.textContent, '🔊', 'Mute button should reflect unmuted state');
assert.strictEqual(renderCallCount, 0, 'toggleMute must not trigger full render()');
console.log('✓ toggleMute toggles audio state without wiping canvas or triggering full render()');

// Test 3: blipolaVoiceAction unsets muted, updates button, no render()
global.muted = true;
renderTopbarMuteOnly();
assert.strictEqual(muteBtn.textContent, '🔇');
blipolaVoiceAction();
assert.strictEqual(global.muted, false, 'blipolaVoiceAction should unmute');
assert.strictEqual(mockStorage['kc_muted'], '0');
assert.strictEqual(muteBtn.textContent, '🔊');
assert.strictEqual(renderCallCount, 0, 'blipolaVoiceAction must not trigger full render()');
console.log('✓ blipolaVoiceAction unsets mute without triggering full render()');

// Test 4: awardStar increments stars and calls renderTopbarStarsOnly directly
const starBadge = { innerHTML: '' };
mockElements['topbarStarBadge'] = starBadge;
const initialStars = global.progress.stars;
awardStar();
assert.strictEqual(global.progress.stars, initialStars + 1, 'Stars should increment by 1');
assert(starBadge.innerHTML.includes(`💎 ${global.progress.stars}`), 'Star badge should update with new diamond count');
assert(starBadge.innerHTML.includes(global.APP_VERSION), 'Star badge should preserve APP_VERSION span');
assert.strictEqual(renderCallCount, 0, 'awardStar must not trigger full render()');
console.log('✓ awardStar performs targeted topbar star update without triggering full render()');

// Test 5: Grade sort targeted update
const sortContainer = { innerHTML: '' };
mockElements['gradeSortContainer'] = sortContainer;
global.gradeQuiz = {
    idx: 0,
    unit: {
        lessons: [
            { type: 'sort', words: ['The', 'cat', 'sat'] }
        ]
    },
    sortPicked: ['The']
};

const updated = renderGradeSortOnly();
assert.strictEqual(updated, true, 'renderGradeSortOnly should return true when sort element is present');
assert(sortContainer.innerHTML.includes('1. The'), 'Sort container should display picked token');
assert(sortContainer.innerHTML.includes('cat'), 'Sort container should display remaining word buttons');
assert(!sortContainer.innerHTML.includes('>The</button>'), 'Picked word button should no longer be in remaining list');
assert.strictEqual(renderCallCount, 0, 'renderGradeSortOnly must not call render()');
console.log('✓ renderGradeSortOnly targetedly updates sentence sorting DOM without full render()');

// Test 6: handleGradeSortChoice execution
global.recordNormalizedGradeAnswer = () => {};
const handleGradeSortChoice = eval(`(${handleGradeSortChoiceSrc})`);
const dummyBtn = {};
handleGradeSortChoice(dummyBtn, 'cat');
assert.deepStrictEqual(global.gradeQuiz.sortPicked, ['The', 'cat'], 'Word should be appended to sortPicked');
assert(sortContainer.innerHTML.includes('2. cat'), 'Second picked token should be rendered in container');
assert.strictEqual(renderCallCount, 0, 'handleGradeSortChoice mid-step must not trigger full render()');

// Test 7: resetGradeSort execution
const resetGradeSort = eval(`(${resetGradeSortSrc})`);
resetGradeSort();
assert.deepStrictEqual(global.gradeQuiz.sortPicked, [], 'sortPicked should be emptied on reset');
assert(sortContainer.innerHTML.includes('Tap the words in the order you want'), 'Empty prompt should be restored');
assert.strictEqual(renderCallCount, 0, 'resetGradeSort must not trigger full render()');
console.log('✓ handleGradeSortChoice and resetGradeSort preserve card state and avoid full render()');

console.log('\nAll N9 render state preservation tests PASSED! ✅');
