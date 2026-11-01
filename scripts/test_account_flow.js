/**
 * Self-test for the account progress merge policy and local save resilience.
 *
 * Creating an account used to upload `{}` and then overwrite the device's
 * progress with the empty cloud copy. Logging in from a different account
 * could also pull one child's anonymous progress into another child's profile.
 * These tests pin the merge helpers that decide what may be adopted.
 *
 * Run with: node scripts/test_account_flow.js
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

const progressHasDataSrc = extractFunction(html, 'progressHasData');
const mergeProgressSrc = extractFunction(html, 'mergeProgress');
const helpers = new Function(`${progressHasDataSrc}\n${mergeProgressSrc}\nreturn { progressHasData, mergeProgress };`)();
const { progressHasData, mergeProgress } = helpers;

console.log('Testing account progress merge policy...');

// 1. Empty vs. real progress detection.
assert.strictEqual(progressHasData(null), false);
assert.strictEqual(progressHasData({}), false);
assert.strictEqual(progressHasData({ stars: 0, mastery: {}, mathCorrect: {} }), false);
assert.strictEqual(progressHasData({ stars: 3 }), true);
assert.strictEqual(progressHasData({ mastery: { 'ELA_L1': 1 } }), true);
assert.strictEqual(progressHasData({ gradeMastery: { '1_0_0': 1 } }), true);
assert.strictEqual(progressHasData({ mathCorrect: { '1': 1 } }), true);
console.log('✓ progressHasData ignores empty shells and detects real work');

// 2. Creating an account must upload what is already on the device.
{
    const local = { stars: 4, mastery: { 'MATH_L1': 2 }, due: { a: '2026-10-01' }, activityLog: [{ at: 1, type: 'x', key: 'k' }] };
    const created = mergeProgress(local, null);
    assert.strictEqual(created, local, 'create flow must keep local progress when cloud is empty');
    assert.strictEqual(created.stars, 4);
    console.log('✓ create flow preserves local progress instead of sending {}');
}

// 3. Cloud remains authoritative for counters that must not be summed.
{
    const local = {
        stars: 5,
        mastery: { 'ELA_L1': 3, 'ELA_L2': 1 },
        mathCorrect: { '1': 2 },
        gradeMastery: { '1_0_0': 1 },
        due: { a: '2026-10-05', b: '2026-10-01' },
        activityLog: [{ at: 1, type: 'answer', key: 'k', itemId: '1' }]
    };
    const cloud = {
        stars: 2,
        mastery: { 'ELA_L1': 1, 'ELA_L3': 4 },
        mathCorrect: { '1': 7 },
        gradeMastery: { '1_0_0': 6 },
        due: { a: '2026-10-02' },
        activityLog: [{ at: 1, type: 'answer', key: 'k', itemId: '1' }, { at: 2, type: 'answer', key: 'k', itemId: '2' }]
    };
    const merged = mergeProgress(local, cloud);
    assert.strictEqual(merged.stars, 5, 'stars must be the higher value, not a sum');
    assert.deepStrictEqual(merged.mastery, { 'ELA_L1': 3, 'ELA_L3': 4, 'ELA_L2': 1 });
    assert.deepStrictEqual(merged.mathCorrect, { '1': 7 });
    assert.deepStrictEqual(merged.gradeMastery, { '1_0_0': 6 });
    assert.deepStrictEqual(merged.due, { a: '2026-10-02', b: '2026-10-01' }, 'earlier due date wins');
    assert.strictEqual(merged.activityLog.length, 2, 'duplicate activity entries are removed');
    console.log('✓ merge keeps max scores, earliest due date, and unique activity');
}

// 4. Login as a different account with real cloud data must not adopt
//    anonymous local progress (the policy branch in submitAccount).
{
    const sameAccount = false;
    const localIsAnonymous = false;
    const local = { stars: 99 };
    const cloud = { stars: 1 };
    const chosen = progressHasData(cloud)
        ? (sameAccount ? mergeProgress(local, cloud) : cloud)
        : ((localIsAnonymous || sameAccount) ? mergeProgress(local, cloud) : cloud);
    assert.deepStrictEqual(chosen, cloud, "a different child's progress must never be merged");
    console.log("✓ different-account login with cloud data keeps cloud progress only");

    const anonymousDevice = true; // no account was selected before this login
    const adopted = progressHasData({})
        ? mergeProgress(local, {})
        : ((anonymousDevice || sameAccount) ? mergeProgress(local, {}) : {});
    assert.strictEqual(adopted.stars, 99, 'anonymous device work is adopted by an empty cloud account');
    console.log('✓ first-time login into an empty cloud account adopts device progress');
}

// 6. second login on the same tablet links the new player identity
//    and flushes normalized data.
{
    const authSrc = 'async ' + extractFunction(html, 'ensureNormalizedAuth');
    const makeAuth = (cloudApi, currentPinVerifier, kcData) => new Function(
        'cloudApi', 'currentPinVerifier', 'window',
        `${authSrc};return ensureNormalizedAuth;`
    )(cloudApi, currentPinVerifier || 'verifier', {
        KCData: kcData || { id: '', flushed: 0, setPlayerId(id) { this.id = id; }, flushNormalized: async () => ({ ok: true }) }
    });

    const cloudCalls = [];
    let currentToken = 'token-player-1';
    const kcData = {
        id: '',
        flushed: 0,
        setPlayerId(id) { this.id = id; },
        flushNormalized: async () => { kcData.flushed++; return { ok: true }; }
    };
    const cloudApi = {
        hasToken: () => !!currentToken,
        me: async () => {
            cloudCalls.push({ method: 'me', token: currentToken });
            return currentToken === 'token-player-1'
                ? { ok: true, name: 'Kid1', playerId: 'player-1', progress: {} }
                : { ok: true, name: 'Kid2', playerId: 'player-2', progress: {} };
        }
    };

    makeAuth({ hasToken: () => false }, 'verifier', kcData)('Kid1').then((res) => {
        assert.strictEqual(res.ok, false);
        assert.strictEqual(res.reason, 'missing credentials');
        assert.strictEqual(cloudCalls.length, 0, 'must not call me() without token');

        return makeAuth(cloudApi, 'verifier', kcData)('Kid1');
    }).then((result) => {
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.playerId, 'player-1');
        assert.strictEqual(kcData.id, 'player-1');
        assert.strictEqual(kcData.flushed, 1);
        assert.strictEqual(cloudCalls.length, 1);
        console.log('✓ first login links player identity to KCData');

        // Shared tablet: another player logs in. Updates player ID and flushes.
        currentToken = 'token-player-2';
        return makeAuth(cloudApi, 'verifier', kcData)('Kid2');
    }).then((result) => {
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.playerId, 'player-2');
        assert.strictEqual(kcData.id, 'player-2', 'second login must update KCData playerId');
        assert.strictEqual(kcData.flushed, 2, 'second login must flush normalized events');
        assert.strictEqual(cloudCalls.length, 2);
        console.log('✓ second login on the same tablet links the new player identity');

        // Expired token rejects auth
        const expiredApi = {
            hasToken: () => true,
            me: async () => ({ ok: false, error: 'token_expired' })
        };
        return makeAuth(expiredApi, 'verifier', kcData)('Kid2');
    }).then((result) => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.reason, 'token_expired');
        console.log('✓ expired token rejection is preserved');
    }).catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
{
    const saveSrc = extractFunction(html, 'saveProgress');
    let announced = '';
    const fakeDocument = { getElementById: () => ({ set textContent(v) { announced = v; } }) };
    const makeSave = () => new Function(
        'progress', 'getCurrentAccount', 'accountProgressKey', 'window', 'document', 'speak', 'console',
        `let storageFullNoticeShown=false;${saveSrc};return saveProgress;`
    );
    const save = makeSave()(
        { stars: 1 },
        () => null,
        () => 'kc_progress_v1',
        { KCData: { localSnapshot() {}, flushNormalized: async () => ({ ok: true }) } },
        fakeDocument,
        () => {},
        { warn() {} }
    );
    const original = global.localStorage;
    global.localStorage = { setItem() { throw new Error('QuotaExceededError'); } };
    try {
        assert.doesNotThrow(() => save(), 'quota errors must not escape saveProgress');
        assert(/storage full/i.test(announced), 'the grown-up is told once that storage is full');
        const again = announced;
        save();
        assert.strictEqual(announced, again, 'the notice is not repeated on every answer');
        console.log('✓ saveProgress survives a full quota and warns only once');
    } finally {
        if (original === undefined) delete global.localStorage;
        else global.localStorage = original;
    }
}
