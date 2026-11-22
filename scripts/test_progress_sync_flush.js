/**
 * TEST-005 follow-up: progress-sync flush / stale-response regression tests.
 *
 * Exercises the REAL functions extracted from index.html against fake timers
 * and a fake cloud API. Run with: node scripts/test_progress_sync_flush.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function extractFunction(source, fnName) {
    const startPattern = `function ${fnName}(`;
    let startIdx = source.indexOf(startPattern);
    assert(startIdx !== -1, `Could not find "${startPattern}" in index.html`);
    if (startIdx >= 6 && source.slice(startIdx - 6, startIdx) === 'async ') startIdx -= 6;
    const openBraceIdx = source.indexOf('{', startIdx);
    let depth = 0, endIdx = -1, inString = null, inLine = false, inBlock = false;
    for (let i = openBraceIdx; i < source.length; i++) {
        const c = source[i], next = source[i + 1];
        if (inLine) { if (c === '\n') inLine = false; continue; }
        if (inBlock) { if (c === '*' && next === '/') { inBlock = false; i++; } continue; }
        if (inString) { if (c === '\\') i++; else if (c === inString) inString = null; continue; }
        if (c === '/' && next === '/') { inLine = true; i++; continue; }
        if (c === '/' && next === '*') { inBlock = true; i++; continue; }
        if (c === '"' || c === "'" || c === '`') { inString = c; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
    }
    assert(endIdx !== -1, `Could not find closing brace for "${fnName}"`);
    return source.slice(startIdx, endIdx);
}

const FN_NAMES = [
    'progressHasData', 'mergeNumericTree', 'mergeProgress', 'mergeLoginProgress',
    'bumpCloudSyncEpoch', 'setCloudSyncStatus', 'scheduleCloudProgressSync',
    'syncCloudProgress', 'drainCloudProgressSync', 'flushCloudProgressSync', 'logoutAccount'
];
const fnsSrc = FN_NAMES.map(n => extractFunction(html, n)).join('\n');

function fakeTimers() {
    let id = 0;
    const jobs = new Map();
    return {
        setTimeout(fn, ms) { const k = ++id; jobs.set(k, fn); return k; },
        clearTimeout(k) { jobs.delete(k); },
        size() { return jobs.size; },
        fireAll() { const list = [...jobs.values()]; jobs.clear(); list.forEach(fn => fn()); }
    };
}
function deferred() {
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    return { promise, resolve };
}

function makeEnv(opts = {}) {
    const timers = fakeTimers();
    const store = Object.assign({}, opts.storage || {});
    const localStorage = {
        getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
        setItem(k, v) { store[k] = String(v); },
        removeItem(k) { delete store[k]; }
    };
    const statuses = [];
    const cloudCalls = [];
    const env = { timers, store, statuses, cloudCalls, account: opts.account || 'alice', progress: opts.progress || { stars: 20 } };
    const doc = { getElementById() { return null; }, documentElement: { dataset: {} } };
    env.api = new Function(
        'localStorage', 'document', 'setTimeout', 'clearTimeout', 'window', 'console',
        'getCurrentAccount', 'getCurrentAccountName', 'setPinVerifier', 'cloudSaveProgress',
        'progress', 'cloudApi', 'closeAccountPopover', 'renderAccountBar', 'render', 'blipola', 'loadProgress',
        `let cloudSyncTimer=null, cloudSyncRetryTimer=null, cloudSyncInFlight=false,
             cloudSyncPending=false, cloudSyncInFlightPromise=null, cloudSyncEpoch=0,
             currentPinVerifier='verifier';
         ${fnsSrc}
         return {
             scheduleCloudProgressSync, syncCloudProgress, drainCloudProgressSync, flushCloudProgressSync,
             bumpCloudSyncEpoch, mergeLoginProgress, progressHasData, mergeProgress,
             logoutAccount,
             setAccount(k){ account=k; },
             setVerifier(v){ currentPinVerifier=v; },
             pending(){ return cloudSyncPending; },
             epoch(){ return cloudSyncEpoch; }
         };`
    )(
        localStorage, doc, timers.setTimeout, timers.clearTimeout,
        { KCData: { setPlayerId() {} }, BlipolaClassroom: { create: () => ({}) } },
        { warn() {} },
        () => env.account,
        () => env.account,
        () => {},
        async (name, p) => { cloudCalls.push({ name, stars: p.stars, progress: p }); return opts.saveResult ? opts.saveResult(name, p) : { ok: true }; },
        env.progress,
        { clearToken() {} },
        () => {}, () => {}, () => {}, {}, () => ({ stars: 0, mastery: {} })
    );
    env.api.setCloudSyncStatusCapture = null;
    // setCloudSyncStatus writes into DOM nodes that are absent in this harness;
    // capture states by watching the no-op document's text nodes instead.
    const originalStatus = env.api.setCloudSyncStatus || null;
    return env;
}

(async () => {
console.log('Testing progress-sync flush and stale-response regression (extracted from index.html)...');

// 1. A pending debounced save is flushed immediately with the newest progress.
{
    const env = makeEnv();
    env.api.scheduleCloudProgressSync(600);
    assert.strictEqual(env.timers.size(), 1, 'debounce timer should be queued');
    env.progress.stars = 21; // second answer before the timer fires
    await awaitFlush(env);
    assert.strictEqual(env.cloudCalls.length, 1, 'flush must write immediately');
    assert.strictEqual(env.cloudCalls[0].stars, 21, 'flush must use the newest progress');
    assert.strictEqual(env.timers.size(), 0, 'debounce timer must be cleared');
    console.log('✓ debounced save flushed immediately with latest progress');
}
async function awaitFlush(env) { return env.api.flushCloudProgressSync(0); }

// 2. Rapid rewards coalesce into one write of the final value.
{
    const env = makeEnv();
    for (let i = 1; i <= 5; i++) { env.progress.stars = 20 + i; env.api.scheduleCloudProgressSync(600); }
    assert.strictEqual(env.timers.size(), 1, 'debounce keeps only one timer');
    await env.api.flushCloudProgressSync(0);
    assert.strictEqual(env.cloudCalls.length, 1, 'rapid answers produce one write');
    assert.strictEqual(env.cloudCalls[0].stars, 25, 'write contains the accumulated reward');
    console.log('✓ rapid rewards coalesce to one save without loss');
}

// 3. Logout waits for the in-flight save before dropping the account.
{
    const gate = deferred();
    const env = makeEnv({ saveResult: () => gate.promise, storage: { kc_current_account: 'alice' } });
    env.progress.stars = 21;
    env.api.scheduleCloudProgressSync(600);
    const loggingOut = env.api.logoutAccount();
    await Promise.resolve(); // let the flush start
    assert.strictEqual(env.store.kc_current_account, 'alice', 'account must survive until save settles');
    gate.resolve({ ok: true });
    await loggingOut;
    assert.strictEqual(env.cloudCalls.length, 1, 'pending save completed during logout');
    assert.strictEqual(env.cloudCalls[0].name, 'alice');
    assert.strictEqual(env.store.kc_current_account, undefined, 'account removed after flush');
    console.log('✓ logout waits for pending write, then clears account');
}

// 4. Stale responses cannot affect a switched account.
{
    const gate = deferred();
    const env = makeEnv();
    env.api.scheduleCloudProgressSync(600);
    const saving = env.api.syncCloudProgress();
    env.api.bumpCloudSyncEpoch(); // account switch
    env.api.setAccount('bob');
    gate.resolve({ ok: true });
    await saving;
    assert.strictEqual(env.cloudCalls.length, 1);
    assert.strictEqual(env.cloudCalls[0].name, 'alice', 'write uses the account captured at start');
    assert.strictEqual(env.timers.size(), 0, 'stale result schedules no retry/status work');
    console.log('✓ stale response cannot write to or update UI for a new account');
}

// 5. Failed save is surfaced, keeps local progress and is recoverable on login.
{
    const env = makeEnv({ saveResult: () => ({ ok: false, reason: 'network' }) });
    env.progress.stars = 22;
    env.store['kc_account_progress_v1_alice'] = JSON.stringify({ stars: 22 });
    env.api.scheduleCloudProgressSync(600);
    const result = await env.api.flushCloudProgressSync(0);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reason, 'network');
    assert.strictEqual(env.store['kc_account_progress_v1_alice'], JSON.stringify({ stars: 22 }), 'local progress preserved');
    assert(env.timers.size() > 0, 'failure schedules a retry');
    console.log('✓ save failure surfaced, local progress kept, retry scheduled');
}

// 6. Merge policy: stale cloud never rolls back newer local data.
{
    const { mergeLoginProgress } = makeEnv().api;
    const staleCloud = { stars: 20, mastery: { letters_L1: { A: 2 } } };
    const newerLocal = { stars: 22, mastery: { letters_L1: { A: 2, B: 2 } } };
    const merged = mergeLoginProgress(newerLocal, staleCloud, null);
    assert.strictEqual(merged.stars, 22, 'stale cloud must not roll back diamonds');
    assert.strictEqual(merged.mastery.letters_L1.B, 2, 'local mastery preserved');
    assert.deepStrictEqual(merged.mastery.letters_L1, { A: 2, B: 2 });

    const anonymous = { stars: 9, mastery: {} };
    const adopted = mergeLoginProgress(null, {}, anonymous);
    assert.strictEqual(adopted.stars, 9, 'empty cloud account may adopt anonymous progress');
    const notAdopted = mergeLoginProgress(null, { stars: 3 }, anonymous);
    assert.strictEqual(notAdopted.stars, 3, 'anonymous progress must not be merged into a non-empty account');
    console.log('✓ login merge preserves newer local progress and isolates anonymous data');
}

// 7. Source-level guards for the surrounding flows.
{
    assert(extractFunction(html, 'handleChoice').includes('if (quiz.awaitingNext) return;'),
        'repeated answer clicks must be ignored while awaiting next');
    assert(extractFunction(html, 'handleGradeChoice').includes('gradeQuiz.awaitingNext'),
        'grade answers need the same duplicate guard');
    assert(extractFunction(html, 'logoutAccount').includes('flushCloudProgressSync()'),
        'logout must flush pending sync');
    assert(extractFunction(html, 'cacheAccount').includes('bumpCloudSyncEpoch()'),
        'account switch must invalidate stale async work');
    assert(extractFunction(html, 'submitAccount').includes('mergeLoginProgress('),
        'login must use the safe merge helper');
    assert(extractFunction(html, 'flushCloudProgressSync').includes('drainCloudProgressSync('),
        'flush must drain, not settle for one in-flight write');
    assert(extractFunction(html, 'drainCloudProgressSync').includes('cloudSyncInFlightPromise'),
        'drain must await in-flight writes and then newer pending writes');
    console.log('✓ duplicate-reward guards and account-change hooks present');
}

// 8. REVIEW BLOCKER: a reward scheduled while a save is in flight must also
//    be flushed before logout clears the account.
{
    const gates = [deferred(), deferred()];
    let call = 0;
    const env = makeEnv({
        storage: { kc_current_account: 'alice' },
        saveResult: () => (++call === 1 ? gates[0].promise : gates[1].promise)
    });
    env.api.scheduleCloudProgressSync(600);
    const firstSave = env.api.syncCloudProgress(); // snapshot: stars 20, in flight
    env.progress.stars = 21;                       // new answer while in flight
    env.api.scheduleCloudProgressSync(600);        // debounced follow-up pending
    const loggingOut = env.api.logoutAccount();
    await new Promise(r => setImmediate(r));
    assert.strictEqual(env.store.kc_current_account, 'alice', 'logout must wait for both writes');
    gates[0].resolve({ ok: true });
    await firstSave;
    await new Promise(r => setImmediate(r));
    assert.strictEqual(env.cloudCalls.length, 2, 'follow-up save must be sent after the first settles');
    assert.strictEqual(env.cloudCalls[1].stars, 21, 'follow-up save must carry the newest progress');
    assert.strictEqual(env.store.kc_current_account, 'alice', 'account not cleared before second write resolves');
    gates[1].resolve({ ok: true });
    await loggingOut;
    assert.strictEqual(env.store.kc_current_account, undefined, 'account cleared only after full drain');
    console.log('✓ logout drains in-flight save plus newer pending save before clearing account');
}

// 9. Equivalent account-switch path: preflush drains both writes and both
//    still target the account that earned them.
{
    const gates = [deferred(), deferred()];
    let call = 0;
    const env = makeEnv({ saveResult: () => (++call === 1 ? gates[0].promise : gates[1].promise) });
    env.api.scheduleCloudProgressSync(600);
    const firstSave = env.api.syncCloudProgress();
    env.progress.stars = 22;
    env.api.scheduleCloudProgressSync(600);
    const preflush = env.api.flushCloudProgressSync(0);
    gates[0].resolve({ ok: true });
    await firstSave;
    await new Promise(r => setImmediate(r));
    env.api.bumpCloudSyncEpoch(); // cacheAccount() equivalent
    env.api.setAccount('bob');
    gates[1].resolve({ ok: true });
    await preflush;
    assert.strictEqual(env.cloudCalls.length, 2);
    assert.deepStrictEqual(env.cloudCalls.map(c => c.name), ['alice', 'alice'], 'both writes target the original account');
    assert.strictEqual(env.cloudCalls[1].stars, 22, 'newest progress written before switch');
    console.log('✓ account-switch preflush drains both writes without cross-account leakage');
}

console.log('\nAll progress-sync regression tests PASSED! ✅');
})().catch((error) => { console.error(error); process.exitCode = 1; });
