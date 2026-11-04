/**
 * Self-test for the kindergarten play-screen announcement split (§6.3).
 *
 * Same double-announce bug as the grade side: the hint bubble and the streak
 * badge are aria-live regions, and speak() read the same (or near-same) text
 * out loud, so a screen-reader user with sound on heard both voices overlap.
 * announcePlayFeedback() splits the channels: visible bubbles/badges keep
 * their text, the sr-only #playFeedbackLive node only gets a short status,
 * and speak() keeps the full sentence.
 *
 * Run with: node scripts/test_play_feedback_announce.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'shared/main.css'), 'utf8');

function extractFunction(source, fnName) {
    let startIdx = source.indexOf(`function ${fnName}(`);
    if (startIdx === -1) startIdx = source.indexOf(`${fnName} = function (`);
    assert(startIdx !== -1, `Could not find "${fnName}" in index.html`);
    const openBraceIdx = source.indexOf('{', startIdx);
    let depth = 0;
    let inString = null;
    let inLineComment = false;
    let inBlockComment = false;
    for (let i = openBraceIdx; i < source.length; i++) {
        const c = source[i];
        const next = source[i + 1];
        if (inLineComment) { if (c === '\n') inLineComment = false; continue; }
        if (inBlockComment) { if (c === '*' && next === '/') { inBlockComment = false; i++; } continue; }
        if (inString) { if (c === '\\') i++; else if (c === inString) inString = null; continue; }
        if (c === '/' && next === '/') { inLineComment = true; i++; continue; }
        if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
        if (c === '"' || c === "'" || c === '`') { inString = c; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return source.slice(startIdx, i + 1); }
    }
    throw new Error(`Could not find matching closing brace for "${fnName}"`);
}

console.log('Testing play-screen feedback announcement split...');

// 1. The helper splits the three channels exactly as specified.
{
    const src = extractFunction(html, 'announcePlayFeedback');
    const visible = { textContent: '' };
    const live = { textContent: '' };
    const spoken = [];
    const document = { getElementById: (id) => (id === 'playFeedbackLive' ? live : null) };
    const speak = (text) => spoken.push(text);
    const fn = new Function('document', 'speak', `${src}; return announcePlayFeedback;`)(document, speak);

    fn(visible, '💡 Full hint text here.', '💡 Hint from Blipola.', 'Full hint text here.');
    assert.strictEqual(visible.textContent, '💡 Full hint text here.', 'visible bubble keeps the full text');
    assert.strictEqual(live.textContent, '💡 Hint from Blipola.', 'live region only gets the short status');
    assert.deepStrictEqual(spoken, ['Full hint text here.'], 'TTS keeps the full sentence');

    // Streak path passes no visible element (badge keeps its own text).
    spoken.length = 0;
    fn(null, null, '🔥 3 in a row!', '🔥 On Fire! Three in a row!');
    assert.strictEqual(live.textContent, '🔥 3 in a row!');
    assert.deepStrictEqual(spoken, ['🔥 On Fire! Three in a row!']);
    console.log('✓ announcePlayFeedback splits visible / live / spoken channels');
}

// 2. The play markup has exactly one live region, and it is not a visible
//    bubble or badge.
{
    assert(html.includes('id="playFeedbackLive" class="sr-only" aria-live="polite"'), 'play screen must render a dedicated sr-only live node');
    assert(!html.includes('id="blipolaMessage" aria-live'), 'hint bubble must not be a live region');
    assert(!html.includes('id="streakBadge" class="streak-badge" aria-live'), 'streak badge must not be a live region');
    console.log('✓ play markup has one sr-only live region; visible bubble and badge are not live');
}

// 3. Hint and streak paths route through the helper; the old overlap is gone.
{
    const hintSrc = extractFunction(html, 'blipolaHint');
    assert(hintSrc.includes('announcePlayFeedback('), 'blipolaHint must route through announcePlayFeedback');

    const updateSrc = extractFunction(html, 'updateStreakBadge');
    assert(updateSrc.includes('playFeedbackLive'), 'clearing the badge must also clear the live node');

    const handleSrc = extractFunction(html, 'handleChoice');
    for (const short of ['10 in a row!', '5 in a row!', '3 in a row!']) {
        assert(handleSrc.includes(short), `streak path must announce short status "${short}"`);
    }
    assert(!handleSrc.includes("speak('🌟 LEGENDARY!"), 'streak TTS must go through the helper, not raw speak');
    // Visible badge text is unchanged for sighted users.
    for (const badge of ['🌟 LEGENDARY! +10', '⚡ Unstoppable! +5', '🔥 On Fire! +2']) {
        assert(handleSrc.includes(badge), `visible badge text "${badge}" must stay unchanged`);
    }
    console.log('✓ hint and streak paths use the helper; visible badge text unchanged');
}

// 4. The .sr-only class actually hides visually.
{
    const m = css.match(/\.sr-only\s*\{([^}]*)\}/);
    assert(m, 'shared/main.css must define .sr-only');
    for (const prop of ['position: absolute', 'width: 1px', 'height: 1px', 'overflow: hidden']) {
        assert(m[1].includes(prop), `.sr-only must include "${prop}"`);
    }
    console.log('✓ .sr-only visually hides the live region');
}

console.log('\nAll play-screen feedback announcement tests PASSED! ✅');
