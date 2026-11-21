/**
 * TEST-001 — Nickname system self-test.
 *
 * Exercises the REAL nickname helpers extracted from index.html (no copied
 * implementation) against an in-memory localStorage and a switchable current
 * account. Covers per-account isolation, Unicode/NFC validation, HTML
 * injection rejection, legacy migration and the guest namespace.
 *
 * Run with: node scripts/test_nickname_system.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

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
        else if (c === '}') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
    }
    assert(endIdx !== -1, `Could not find matching closing brace for "${fnName}"`);
    return source.slice(startIdx, endIdx);
}

const FN_NAMES = [
    'nicknameNamespace', 'nicknameStorageKey', 'normalizeNickname',
    'isValidNickname', 'getNickname', 'setNickname'
];
const helpersSrc = FN_NAMES.map((name) => extractFunction(html, name)).join('\n');

/** Build a fresh sandbox whose localStorage can be seeded and inspected. */
function makeEnv(seed) {
    const store = Object.assign({}, seed || {});
    const localStorage = {
        getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
        setItem(k, v) { store[k] = String(v); },
        removeItem(k) { delete store[k]; }
    };
    const ctx = { account: '' };
    const api = new Function('localStorage', 'ctx', 'store', `
        const NICKNAME_LEGACY_KEY = 'kc_nickname_v1';
        const NICKNAME_KEY_PREFIX = 'kc_nickname_v1_';
        const NICKNAME_GUEST_NAMESPACE = 'guest';
        const getCurrentAccount = () => ctx.account || '';
        ${helpersSrc}
        return {
            getNickname, setNickname, normalizeNickname, isValidNickname,
            nicknameStorageKey, nicknameNamespace,
            switchAccount(key) { ctx.account = key || ''; },
            raw(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; }
        };
    `)(localStorage, ctx, store);
    return api;
}

console.log('Testing per-account nickname system (extracted from index.html)...');

// 1. Chinese nickname saves and reloads.
{
    const env = makeEnv();
    assert.strictEqual(env.setNickname('小星星'), true);
    assert.strictEqual(env.getNickname(), '小星星');
    assert.strictEqual(env.raw('kc_nickname_v1_guest'), '小星星');
    assert.strictEqual(env.raw('kc_nickname_v1'), null, 'legacy key must never be written');
    console.log('✓ Chinese nickname saves and reloads');
}

// 2. English nickname saves and reloads; NFC normalization is applied.
{
    const env = makeEnv();
    assert.strictEqual(env.setNickname('Leo'), true);
    assert.strictEqual(env.getNickname(), 'Leo');

    const decomposed = 'e\u0301e\u0301'; // two e + combining acute accents
    assert.strictEqual(env.setNickname(decomposed), true);
    assert.strictEqual(env.raw('kc_nickname_v1_guest'), '\u00e9\u00e9', 'input must be NFC-normalized before storage');
    assert.strictEqual(env.getNickname(), '\u00e9\u00e9');
    console.log('✓ English nickname saves/reloads and input is NFC-normalized');
}

// 3. Switching between two child accounts keeps nicknames isolated.
{
    const env = makeEnv();
    env.switchAccount('alice');
    assert.strictEqual(env.setNickname('Alice A'), true);
    assert.strictEqual(env.getNickname(), 'Alice A');

    env.switchAccount('bob');
    assert.strictEqual(env.getNickname(), '', 'a different child must never see Alice nickname');
    assert.strictEqual(env.setNickname('Bob B'), true);

    env.switchAccount('alice');
    assert.strictEqual(env.getNickname(), 'Alice A');
    env.switchAccount('bob');
    assert.strictEqual(env.getNickname(), 'Bob B');
    assert.strictEqual(env.raw('kc_nickname_v1_acct_alice'), 'Alice A');
    assert.strictEqual(env.raw('kc_nickname_v1_acct_bob'), 'Bob B');

    // The account key is the lowercase stable identifier used for all per-account storage.
    env.switchAccount('ALICE');
    assert.strictEqual(env.getNickname(), 'Alice A', 'account key is case-insensitive/stable');
    assert.strictEqual(env.nicknameNamespace('alice'), env.nicknameNamespace('ALICE'));
    console.log('✓ two child accounts have independent nicknames across switches');
}

// 4. Clearing a nickname.
{
    const env = makeEnv();
    env.switchAccount('alice');
    env.setNickname('Alice A');
    assert.strictEqual(env.setNickname(''), false, 'empty input clears rather than storing');
    assert.strictEqual(env.getNickname(), '');
    assert.strictEqual(env.raw('kc_nickname_v1_acct_alice'), null);
    console.log('✓ clearing a nickname removes the stored value');
}

// 5. Invalid input is rejected; valid edge cases are accepted.
{
    const invalid = [
        '', ' ', '   ', 'A', 'a'.repeat(17), 'ab<p>', 'a\nb',
        '--', "''", '\u{1f600}\u{1f600}', 'a\u0000b', 'a\u200bb'
    ];
    for (const value of invalid) {
        assert.strictEqual(makeEnv().isValidNickname(value), false, `must reject: ${JSON.stringify(value)}`);
        const env = makeEnv();
        assert.strictEqual(env.setNickname(value), false, `setNickname must reject: ${JSON.stringify(value)}`);
        assert.strictEqual(env.getNickname(), '');
    }
    const valid = ['Leo', '小星星', 'A B', "O'Neil", 'Li-wei', '\u00c9lodie', 'a'.repeat(16), '\u{20000}\u{20001}'];
    for (const value of valid) {
        const env = makeEnv();
        assert.strictEqual(env.isValidNickname(value), true, `must accept: ${JSON.stringify(value)}`);
        assert.strictEqual(env.setNickname(value), true);
        assert.strictEqual(env.getNickname(), value);
    }
    console.log('✓ invalid input rejected (empty, too short/long, punctuation-only, control/emoji); valid Unicode accepted');
}

// 6. HTML injection attempts are rejected on write and on read.
{
    const attacks = [
        '<script>alert(1)</script>',
        '"><img src=x onerror=alert(1)>',
        '<b>Hi</b>',
        '&#60;script&#62;'
    ];
    for (const attack of attacks) {
        const env = makeEnv();
        assert.strictEqual(env.isValidNickname(attack), false, `validator must reject: ${attack}`);
        assert.strictEqual(env.setNickname(attack), false, `setNickname must reject: ${attack}`);
        assert.strictEqual(env.getNickname(), '', `getNickname must not surface: ${attack}`);
        assert.strictEqual(env.raw('kc_nickname_v1_guest'), null);
    }
    // Defense in depth: a tampered localStorage value is re-validated on read.
    const tampered = makeEnv({ 'kc_nickname_v1_guest': '<img src=x onerror=alert(1)>' });
    assert.strictEqual(tampered.getNickname(), '', 'tampered HTML in storage must be ignored');
    assert.strictEqual(tampered.raw('kc_nickname_v1_guest'), null, 'invalid stored value must be purged');

    // The greeting still routes through the HTML escaper.
    assert(extractFunction(html, 'renderHome').includes('esc(nickname)'),
        'renderHome must keep HTML-escaping the nickname');
    console.log('✓ HTML/JS injection rejected on write, on read, and greeting remains escaped');
}

// 7. Legacy nickname migration: ownerless value goes to guest only, once.
{
    const env = makeEnv({ 'kc_nickname_v1': 'Leo' });
    assert.strictEqual(env.getNickname(), 'Leo');
    assert.strictEqual(env.raw('kc_nickname_v1_guest'), 'Leo');
    assert.strictEqual(env.raw('kc_nickname_v1'), null, 'legacy key consumed after migration');
    assert.strictEqual(env.getNickname(), 'Leo', 'migration is idempotent');
    console.log('✓ valid legacy nickname migrates into guest namespace exactly once');
}
{
    const env = makeEnv({ 'kc_nickname_v1': 'Leo' });
    env.switchAccount('alice');
    assert.strictEqual(env.getNickname(), '', 'named child must NOT inherit the ownerless legacy nickname');
    assert.strictEqual(env.raw('kc_nickname_v1'), 'Leo', 'account read does not consume legacy value');
    env.switchAccount('');
    assert.strictEqual(env.getNickname(), 'Leo', 'legacy value is still available to guest later');
    console.log('✓ legacy nickname is never silently assigned to a named child');
}
{
    for (const bad of ['<script>x</script>', '   ', 'A']) {
        const env = makeEnv({ 'kc_nickname_v1': bad });
        assert.strictEqual(env.getNickname(), '', `invalid legacy value must be discarded: ${bad}`);
        assert.strictEqual(env.raw('kc_nickname_v1'), null, 'invalid legacy key must still be consumed');
        assert.strictEqual(env.raw('kc_nickname_v1_guest'), null, 'invalid legacy value must not be copied');
    }
    console.log('✓ invalid legacy data is discarded without being propagated');
}

// 8. Guest namespace is separate from every child account.
{
    const env = makeEnv();
    assert.strictEqual(env.setNickname('Guest G'), true);
    env.switchAccount('alice');
    assert.strictEqual(env.getNickname(), '', 'guest nickname must not appear for a child');
    assert.strictEqual(env.setNickname('Alice A'), true);
    env.switchAccount('');
    assert.strictEqual(env.getNickname(), 'Guest G', 'guest nickname survives account switching');
    assert.notStrictEqual(env.nicknameStorageKey(''), env.nicknameStorageKey('alice'));
    console.log('✓ guest/default namespace is isolated from child accounts');
}

// 9. The UI save path uses the same validation and escaping-safe helpers.
{
    const saveSrc = extractFunction(html, 'saveNickname');
    function makeSaveUi(env) {
        let closed = 0;
        let rendered = 0;
        const input = { value: '' };
        const errEl = { textContent: '', style: {} };
        const doc = {
            getElementById(id) {
                if (id === 'nicknameInput') return input;
                if (id === 'nicknameError') return errEl;
                return null;
            }
        };
        const save = new Function(
            'document', 'normalizeNickname', 'isValidNickname', 'setNickname', 'closeThemeModal', 'render',
            `${saveSrc}; return saveNickname;`
        )(doc, env.normalizeNickname, env.isValidNickname, env.setNickname,
           () => { closed++; }, () => { rendered++; });
        return { save, input, errEl, counters: () => ({ closed, rendered }) };
    }

    const env = makeEnv();
    const ui = makeSaveUi(env);
    ui.input.value = '小明';
    ui.save();
    assert.strictEqual(env.getNickname(), '小明');
    assert.strictEqual(ui.errEl.style.display, 'none');
    assert.deepStrictEqual(ui.counters(), { closed: 1, rendered: 1 });

    ui.input.value = '<img src=x onerror=alert(1)>';
    ui.save();
    assert.strictEqual(env.getNickname(), '小明', 'injection must not overwrite the saved nickname');
    assert.strictEqual(ui.errEl.style.display, 'block', 'an error must be shown');
    assert.match(ui.errEl.textContent, /2–16/);
    assert.deepStrictEqual(ui.counters(), { closed: 1, rendered: 1 }, 'invalid save must not close the modal');

    ui.input.value = '   ';
    ui.save();
    assert.strictEqual(env.getNickname(), '', 'empty input clears the nickname');
    assert.deepStrictEqual(ui.counters(), { closed: 2, rendered: 2 });
    console.log('✓ UI save path validates, shows errors, and clears on empty input');
}

// 10. Account deletion removes that account's nickname as well.
assert(html.includes('localStorage.removeItem(nicknameStorageKey(key))'),
    'delete-account flow must remove the nickname stored for that account key');
console.log('✓ deleting an account also removes its nickname key');

console.log('\nAll nickname system tests PASSED! ✅');
