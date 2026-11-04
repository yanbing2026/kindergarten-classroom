/**
 * Self-test for the grade feedback announcement split (§6.3).
 *
 * Every grade answer used to set the FULL explanation as both the visible
 * text of an aria-live region and the TTS sentence, so a screen-reader user
 * with sound on heard both voices talk over each other. Now
 * announceGradeFeedback() splits the channels: the visible bubble keeps the
 * full text, the screen-reader live region only gets a short status, and
 * speak() keeps the full sentence. When muted, speak() is a no-op and the
 * live region is the only channel.
 *
 * Run with: node scripts/test_feedback_announce.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'shared/main.css'), 'utf8');

function extractFunction(source, fnName) {
    let startIdx = source.indexOf(`function ${fnName}(`);
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

console.log('Testing grade feedback announcement split...');

// 1. The helper splits the three channels exactly as specified.
{
    const src = extractFunction(html, 'announceGradeFeedback');
    const visible = { textContent: '' };
    const live = { textContent: '' };
    const spoken = [];
    const document = { getElementById: (id) => (id === 'gradeFeedbackLive' ? live : null) };
    const speak = (text) => spoken.push(text);
    const fn = new Function('document', 'speak', `${src}; return announceGradeFeedback;`)(document, speak);

    fn(visible, '✓ Correct! Long explanation here.', '✓ Correct!', 'Correct! Long explanation here.');
    assert.strictEqual(visible.textContent, '✓ Correct! Long explanation here.', 'visible bubble keeps the full text');
    assert.strictEqual(live.textContent, '✓ Correct!', 'live region only gets the short status');
    assert.deepStrictEqual(spoken, ['Correct! Long explanation here.'], 'TTS keeps the full sentence');

    // Muted path: no spoken text, but the live region must still announce.
    spoken.length = 0;
    fn(visible, 'Try again. Hint here.', 'Try again.', null);
    assert.strictEqual(visible.textContent, 'Try again. Hint here.');
    assert.strictEqual(live.textContent, 'Try again.');
    assert.strictEqual(spoken.length, 0, 'null spoken text must not call speak');
    console.log('✓ announceGradeFeedback splits visible / live / spoken channels, mute-safe');
}

// 2. The lesson markup has exactly one live region, and it is not the
//    visible bubble: a screen reader must not re-announce the full text.
{
    assert(html.includes('id="gradeFeedbackLive"'), 'lesson must render a dedicated live node');
    assert(html.includes('gradeFeedbackLive" class="sr-only" aria-live="polite"'), 'live node is visually hidden and polite');
    assert(!html.includes('id="gradeFeedback" class="grade-feedback" aria-live'), 'visible feedback bubble must not be a live region');
    assert(!html.includes('id="gradeBlipolaMessage" aria-live'), 'hint bubble must not be a live region (hints go through the helper)');
    console.log('✓ lesson markup has one sr-only live region; visible bubbles are not live');
}

// 3. All grade answer paths route through the helper — no handler may set
//    long text on a live region and speak the same sentence anymore.
{
    for (const fnName of ['finishInteractiveAnswer', 'handleGradeChoice', 'handleGradeSortChoice', 'handleGradeNumberSubmit', 'handleGradeTextSubmit', 'gradeHint', 'retryOriginalAfterRemediation']) {
        const src = extractFunction(html, fnName);
        assert(src.includes('announceGradeFeedback('), `${fnName} must route through announceGradeFeedback`);
    }
    // The old double-announce pattern (full text into live div + same speak)
    // must be gone from the grade handlers.
    const handlers = ['finishInteractiveAnswer', 'handleGradeChoice', 'handleGradeSortChoice', 'handleGradeNumberSubmit', 'handleGradeTextSubmit']
        .map((n) => extractFunction(html, n)).join('\n');
    assert(!handlers.includes("feedback.textContent='✓ Correct!'"), 'old pattern must be gone (correct)');
    assert(!handlers.includes("feedback.textContent='Try again.'"), 'old pattern must be gone (retry)');
    assert(!handlers.includes("feedback.textContent='✓ Writing check:"), 'old pattern must be gone (writing)');
    assert(!handlers.includes("feedback.textContent='Keep going."), 'old pattern must be gone (keep going)');
    console.log('✓ all 7 grade feedback paths use the helper; old double-announce pattern is gone');
}

// 4. The .sr-only class actually hides visually (otherwise the short status
//    would show twice on screen).
{
    const m = css.match(/\.sr-only\s*\{([^}]*)\}/);
    assert(m, 'shared/main.css must define .sr-only');
    for (const prop of ['position: absolute', 'width: 1px', 'height: 1px', 'overflow: hidden']) {
        assert(m[1].includes(prop), `.sr-only must include "${prop}"`);
    }
    console.log('✓ .sr-only visually hides the live region');
}

console.log('\nAll grade feedback announcement tests PASSED! ✅');
