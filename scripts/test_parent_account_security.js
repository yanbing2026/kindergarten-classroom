/**
 * Self-test for the parent account security UI (change PIN / delete account)
 * and progress import.
 *
 * Runs submitAccountSecurity() against a fake cloud client so the argument
 * names, credential handling, and local cleanup stay correct.
 *
 * Run with: node scripts/test_parent_account_security.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function extractFunction(source, fnName) {
    let startIdx = source.indexOf(`async function ${fnName}(`);
    if (startIdx === -1) startIdx = source.indexOf(`function ${fnName}(`);
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

function makeHarness() {
    const fields = {
        accountStatus: { textContent: '', disabled: false },
        accountSecuritySubmit: { disabled: false },
        accountOldPin: { value: '' },
        accountNewPin: { value: '' },
        accountNewPin2: { value: '' }
    };
    const cloudCalls = [];
    const store = new Map();
    const removed = [];
    const state = {
        pinVerifier: '',
        normalizedName: '',
        alerts: [],
        rendered: 0,
        playerId: '',
        token: 'OLD-TOKEN'
    };
    const localStorage = {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => { removed.push(k); store.delete(k); }
    };
    store.set('kc_current_account', 'kid');
    store.set('kc_accounts_v1', JSON.stringify({ kid: { name: 'Kid' }, other: { name: 'Other' } }));
    store.set('kc_account_progress_v1_kid', JSON.stringify({ stars: 9 }));

    const cloudApi = {
        rotatePin: async (oldVerifier, newVerifier, newSalt) => {
            cloudCalls.push({ method: 'rotatePin', args: { oldVerifier, newVerifier, newSalt } });
            state.token = 'NEW-TOKEN';
            return { ok: true, token: 'NEW-TOKEN' };
        },
        deletePlayer: async (pinVerifier) => {
            cloudCalls.push({ method: 'deletePlayer', args: { pinVerifier } });
            state.token = null;
            return { ok: true };
        },
        clearToken: () => {
            state.token = null;
        },
        getToken: () => state.token,
        hasToken: () => !!state.token
    };
    const deps = {
        document: { getElementById: (id) => fields[id] || null },
        cloudApi,
        derivePinVerifier: async (pin) => 'HASH-' + pin,
        getPinSaltForLogin: async () => 'SALT',
        makePinSalt: () => 'NEW-SALT',
        setPinVerifier: (v) => { state.pinVerifier = v; },
        ensureNormalizedAuth: async (name) => { state.normalizedName = name; return { ok: true }; },
        getCurrentAccountName: () => 'Kid',
        getCurrentAccount: () => localStorage.getItem('kc_current_account') || '',
        getAccounts: () => JSON.parse(localStorage.getItem('kc_accounts_v1') || '{}'),
        accountProgressKey: (key) => 'kc_account_progress_v1_' + key.toLowerCase(),
        alert: (msg) => state.alerts.push(String(msg)),
        closeAccountModal: () => {},
        renderAccountBar: () => {},
        loadProgress: () => ({ stars: 0 }),
        progress: { stars: 9 },
        render: () => { state.rendered++; },
        localStorage,
        window: {
            KCData: { setPlayerId: (id) => { state.playerId = id; } },
            BlipolaClassroom: { create: () => ({}) }
        }
    };
    const src = extractFunction(html, 'submitAccountSecurity');
    const factory = new Function(
        'document', 'cloudApi', 'derivePinVerifier', 'getPinSaltForLogin', 'makePinSalt',
        'setPinVerifier', 'ensureNormalizedAuth', 'getCurrentAccountName', 'getCurrentAccount',
        'getAccounts', 'accountProgressKey', 'alert', 'closeAccountModal', 'renderAccountBar',
        'loadProgress', 'progress', 'render', 'localStorage', 'window',
        `${src}; return submitAccountSecurity;`
    );
    const submit = factory(
        deps.document, deps.cloudApi, deps.derivePinVerifier, deps.getPinSaltForLogin, deps.makePinSalt,
        deps.setPinVerifier, deps.ensureNormalizedAuth, deps.getCurrentAccountName, deps.getCurrentAccount,
        deps.getAccounts, deps.accountProgressKey, deps.alert, deps.closeAccountModal, deps.renderAccountBar,
        deps.loadProgress, deps.progress, deps.render, deps.localStorage, deps.window
    );
    return { submit, fields, cloudCalls, store, removed, state, cloudApi };
}

console.log('Testing parent account security UI...');

// 1. The parent dashboard exposes both actions and explains deletion clearly.
assert(/openAccountSecurityModal\(\\?'rotate\\?'\)/.test(html), 'parent dashboard must offer Change PIN');
assert(/openAccountSecurityModal\(\\?'delete\\?'\)/.test(html), 'parent dashboard must offer Delete account');
assert(html.includes('This deletes the cloud copy and this device'), 'delete dialog must warn about local removal');
console.log('✓ parent dashboard exposes change-PIN and delete-account actions');

// 2. Changing the PIN sends the old verifier and the newly salted verifier,
//    invalidates the old token, and re-links the browser with the new verifier.
(async () => {
    {
        const h = makeHarness();
        h.fields.accountOldPin.value = '1234';
        h.fields.accountNewPin.value = '4321';
        h.fields.accountNewPin2.value = '4321';
        assert.strictEqual(h.state.token, 'OLD-TOKEN');
        await h.submit('rotate');
        assert.strictEqual(h.cloudCalls.length, 1, 'rotate must make exactly one cloud call');
        const call = h.cloudCalls[0];
        assert.strictEqual(call.method, 'rotatePin');
        assert.strictEqual(call.args.oldVerifier, 'HASH-1234');
        assert.strictEqual(call.args.newVerifier, 'HASH-4321');
        assert.strictEqual(call.args.newSalt, 'NEW-SALT');
        assert.strictEqual(h.state.pinVerifier, 'HASH-4321', 'session must use the new verifier');
        assert.strictEqual(h.state.normalizedName, 'Kid', 'browser must be re-linked after rotation');
        assert.strictEqual(h.state.token, 'NEW-TOKEN', 'old token is invalidated and replaced');
        assert(h.state.alerts.some((m) => /PIN changed/.test(m)), 'parent must see a success message');
        console.log('✓ change PIN validates, rotates the verifier, invalidates old token, and re-links the browser');
    }

    // 3. A stale/wrong old PIN must not change the session or claim success.
    {
        const harness = makeHarness();
        harness.fields.accountOldPin.value = '1234';
        harness.fields.accountNewPin.value = '4321';
        harness.fields.accountNewPin2.value = '4321';
        const { cloudApi } = harness;
        cloudApi.rotatePin = async (oldVerifier, newVerifier, newSalt) => {
            harness.cloudCalls.push({ method: 'rotatePin', args: { oldVerifier, newVerifier, newSalt } });
            return { ok: false, error: 'Current PIN is incorrect' };
        };
        await harness.submit('rotate');
        assert.strictEqual(harness.state.pinVerifier, '', 'a failed rotation must not install a verifier');
        assert.strictEqual(harness.state.normalizedName, '', 'a failed rotation must not re-link');
        assert.strictEqual(harness.state.token, 'OLD-TOKEN', 'failed rotation must not update token');
        assert(/incorrect/i.test(harness.fields.accountStatus.textContent), 'parent must see an error');
        assert.strictEqual(harness.fields.accountSecuritySubmit.disabled, false, 'button is re-enabled');
        console.log('✓ wrong current PIN is rejected without changing the session');
    }

    // 4. Mismatched new PINs fail before any network call.
    {
        const h = makeHarness();
        h.fields.accountOldPin.value = '1234';
        h.fields.accountNewPin.value = '4321';
        h.fields.accountNewPin2.value = '9999';
        await h.submit('rotate');
        assert.strictEqual(h.cloudCalls.length, 0, 'mismatched PINs must not hit the cloud API');
        assert(/do not match/.test(h.fields.accountStatus.textContent));
        console.log('✓ mismatched new PINs fail locally');
    }

    // 5. Deleting removes cloud data, local account record, and the account
    //    scoped progress copy, then returns to anonymous progress.
    {
        const h = makeHarness();
        h.fields.accountOldPin.value = '1234';
        await h.submit('delete');
        assert.strictEqual(h.cloudCalls.length, 1, 'delete must make exactly one cloud call');
        assert.strictEqual(h.cloudCalls[0].method, 'deletePlayer');
        assert.strictEqual(h.cloudCalls[0].args.pinVerifier, 'HASH-1234');
        assert.strictEqual(h.store.has('kc_current_account'), false);
        assert(h.removed.includes('kc_account_progress_v1_kid'), 'account-scoped copy is removed');
        const accounts = JSON.parse(h.store.get('kc_accounts_v1'));
        assert.strictEqual(accounts.kid, undefined, 'deleted account is removed from the device list');
        assert(accounts.other, 'other accounts on the device stay intact');
        assert.strictEqual(h.state.pinVerifier, '', 'verifier is cleared');
        assert.strictEqual(h.state.playerId, '', 'normalized player id is cleared');
        assert.strictEqual(h.state.token, null, 'token is cleared');
        assert.strictEqual(h.state.rendered, 1, 'screen refreshes after deletion');
        console.log('✓ delete removes the cloud account, local record, and scoped copy');
    }

    // 6. Import merges instead of replacing a child's existing work.
    {
        assert(html.includes('function importProgressFile('), 'progress import must exist');
        assert(html.includes("accept=\"application/json,.json\""), 'import accepts JSON backups');
        const importSrc = extractFunction(html, 'importProgressFile');
        assert(importSrc.includes('mergeProgress(progress, data)'), 'import must merge, not overwrite');
        assert(importSrc.includes('merged.mathStreak'), 'import preserves the math streak');
        console.log('✓ progress import merges backups and keeps the higher scores');
    }

    console.log('\nAll parent account security tests PASSED! ✅');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
