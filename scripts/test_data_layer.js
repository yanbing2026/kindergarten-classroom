/**
 * Self-test for js/data-layer.js account scoping and sync result handling.
 *
 * The data layer used to read `kc_current_account` with JSON.parse, but the
 * app stores a plain lowercase account key there. That made currentAccount()
 * null, so queued events were never attributed to the account and the legacy
 * sync always reported success. These tests lock the fixed behaviour.
 *
 * Run with: node scripts/test_data_layer.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'js/data-layer.js'), 'utf8');

function createHarness(seed = {}) {
    const store = new Map(Object.entries(seed).map(([k, v]) => [k, String(v)]));
    const localStorage = {
        getItem: key => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: key => store.delete(key),
        clear: () => store.clear()
    };
    const listeners = {};
    const window = {
        crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000001' },
        addEventListener: (name, fn) => { (listeners[name] = listeners[name] || []).push(fn); },
        dispatchEvent: () => true
    };
    window.window = window;
    const context = vm.createContext({
        window,
        localStorage,
        navigator: { onLine: true },
        console,
        Date,
        Math,
        JSON,
        String,
        Number,
        Object,
        Array,
        Set,
        CustomEvent: function CustomEvent(type) { this.type = type; }
    });
    vm.runInContext(source, context, { filename: 'js/data-layer.js' });
    return { window, localStorage, store };
}

console.log('Testing data-layer account scoping and sync results...');

// 1. Plain-string account key (what index.html actually writes).
{
    const { window } = createHarness({
        kc_current_account: 'mia',
        kc_accounts_v1: JSON.stringify({ mia: { name: 'Mia' } })
    });
    const account = window.KCData.currentAccount();
    assert(account, 'currentAccount() must not be null for a plain-string key');
    assert.strictEqual(account.key, 'mia');
    assert.strictEqual(account.name, 'Mia');
    console.log('✓ plain-string kc_current_account is resolved to its stored display name');
}

// 2. Legacy JSON shape still works.
{
    const { window } = createHarness({
        kc_current_account: JSON.stringify({ key: 'sam', name: 'Sam' })
    });
    const account = window.KCData.currentAccount();
    assert.strictEqual(account.key, 'sam');
    assert.strictEqual(account.name, 'Sam');
    assert.strictEqual(JSON.stringify(account), JSON.stringify({ key: 'sam', name: 'Sam' }));
    console.log('✓ legacy JSON kc_current_account still resolves');
}

// 3. No account selected -> null.
{
    const { window } = createHarness({});
    assert.strictEqual(window.KCData.currentAccount(), null);
    console.log('✓ missing kc_current_account resolves to null');
}

// 4. Queued events are scoped to the current account.
{
    const { window } = createHarness({ kc_current_account: 'mia' });
    window.KCData.recordActivity({ subjectKey: 'ela', correct: true });
    const queue = window.KCData._loadQueue();
    assert.strictEqual(queue.length, 1);
    assert.strictEqual(queue[0].accountKey, 'mia', 'queued event must carry the account key');
    console.log('✓ queued events carry the selected account key');
}

// 5. A failed legacy RPC must not be reported as saved.
(async () => {
    const { window } = createHarness({ kc_current_account: 'mia' });
    window.cloudSaveProgress = async () => ({ ok: false, reason: 'not authorized' });
    const result = await window.KCData.flush({ stars: 1 });
    assert.strictEqual(result.ok, false, 'failed legacy save must return ok:false');
    assert.strictEqual(result.reason, 'not authorized');

    window.cloudSaveProgress = async () => ({ ok: true });
    const good = await window.KCData.flush({ stars: 2 });
    assert.strictEqual(good.ok, true);

    // Older bridge returned a boolean; false must still fail.
    window.cloudSaveProgress = async () => false;
    const legacyFail = await window.KCData.flush({ stars: 3 });
    assert.strictEqual(legacyFail.ok, false);
    console.log('✓ sync result propagates RPC failure and legacy boolean failure');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
