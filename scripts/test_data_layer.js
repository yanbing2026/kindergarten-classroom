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

    // 6. status() hasCloud and hasSupabase compatibility
    {
        const { window } = createHarness();
        const st1 = window.KCData.status();
        assert.strictEqual(st1.hasCloud, false);
        assert.strictEqual(st1.hasSupabase, false);

        window.KCCloud = { hasToken: () => true };
        const st2 = window.KCData.status();
        assert.strictEqual(st2.hasCloud, true);
        assert.strictEqual(st2.hasSupabase, false);
        console.log('✓ status() reports hasCloud and maintains hasSupabase: false');
    }

    // 7. flushNormalized() when not linked (no token or no KCCloud)
    {
        const { window } = createHarness({ kc_current_account: 'mia' });
        const res = await window.KCData.flushNormalized();
        assert.strictEqual(res.ok, false);
        assert.strictEqual(res.skipped, true);
        assert.strictEqual(res.reason, 'normalized auth not linked');
        console.log('✓ flushNormalized skips with reason when unauthenticated');
    }

    // 8. flushNormalized() sends events, rows, goals with camelCase and clears queue on success
    {
        const { window } = createHarness({
            kc_current_account: 'mia',
            kc_accounts_v1: JSON.stringify({ mia: { name: 'Mia' } })
        });
        const calls = { events: [], rows: [], goals: [] };
        window.KCCloud = {
            hasToken: () => true,
            sendEvents: async (rows) => { calls.events.push(...rows); return { ok: true, accepted: rows.length }; },
            sendRows: async (rows) => { calls.rows.push(...rows); return { ok: true, accepted: rows.length }; },
            sendGoals: async (rows) => { calls.goals.push(...rows); return { ok: true, accepted: rows.length }; }
        };

        window.KCData.recordActivity({
            gradeLevel: 'k',
            subjectKey: 'ela',
            unitKey: 'letters',
            eventType: 'question',
            correct: true,
            firstTry: true,
            score: 1,
            durationMs: 1200,
            metadata: { qId: 'q1' }
        });
        window.KCData.recordProgress({
            gradeLevel: 'k',
            subjectKey: 'ela',
            unitKey: 'letters',
            mastery: 80,
            stars: 3,
            attempts: 5,
            correct: 4,
            firstTryCorrect: 4,
            metadata: { level: 1 }
        });
        window.KCData.recordDailyGoal({
            goalDate: '2026-11-01',
            targetQuestions: 10,
            completedQuestions: 10,
            completed: true,
            metadata: { streak: 2 }
        });

        assert.strictEqual(window.KCData._loadQueue().length, 3);
        const res = await window.KCData.flushNormalized();
        assert.strictEqual(res.ok, true);
        assert.strictEqual(res.sent, 3);
        assert.strictEqual(res.remaining, 0);
        assert.strictEqual(window.KCData._loadQueue().length, 0);

        // Verify camelCase fields in payload
        assert.strictEqual(calls.events.length, 1);
        assert.strictEqual(calls.events[0].gradeLevel, 'k');
        assert.strictEqual(calls.events[0].subjectKey, 'ela');
        assert.strictEqual(calls.events[0].unitKey, 'letters');
        assert.strictEqual(calls.events[0].eventType, 'question');
        assert.strictEqual(calls.events[0].correct, true);
        assert.strictEqual(calls.events[0].firstTry, true);
        assert.strictEqual(calls.events[0].score, 1);
        assert.strictEqual(calls.events[0].durationMs, 1200);
        assert.strictEqual(calls.events[0].clientEventId, '00000000-0000-4000-8000-000000000001');

        assert.strictEqual(calls.rows.length, 1);
        assert.strictEqual(calls.rows[0].gradeLevel, 'k');
        assert.strictEqual(calls.rows[0].mastery, 80);
        assert.strictEqual(calls.rows[0].stars, 3);
        assert.strictEqual(calls.rows[0].attempts, 5);
        assert.strictEqual(calls.rows[0].correct, 4);
        assert.strictEqual(calls.rows[0].firstTryCorrect, 4);

        assert.strictEqual(calls.goals.length, 1);
        assert.strictEqual(calls.goals[0].goalDate, '2026-11-01');
        assert.strictEqual(calls.goals[0].targetQuestions, 10);
        assert.strictEqual(calls.goals[0].completedQuestions, 10);
        assert.strictEqual(calls.goals[0].completed, true);
        console.log('✓ flushNormalized formats camelCase payload and clears queue upon success');
    }

    // 9. flushNormalized() handles error midway, preserves unsent entries and reports sent count
    {
        const { window } = createHarness({
            kc_current_account: 'mia',
            kc_accounts_v1: JSON.stringify({ mia: { name: 'Mia' } })
        });
        let uuidSeq = 1;
        window.crypto = { randomUUID: () => '00000000-0000-4000-8000-' + String(uuidSeq++).padStart(12, '0') };
        window.KCCloud = {
            hasToken: () => true,
            sendEvents: async () => ({ ok: true, accepted: 1 }),
            sendRows: async () => ({ ok: false, error: 'rate_limited' }),
            sendGoals: async () => ({ ok: true, accepted: 1 })
        };

        window.KCData.recordActivity({ subjectKey: 'ela', correct: true });
        window.KCData.recordProgress({ subjectKey: 'ela', mastery: 50 });
        window.KCData.recordDailyGoal({ goalDate: '2026-11-01', targetQuestions: 5 });

        assert.strictEqual(window.KCData._loadQueue().length, 3);
        const res = await window.KCData.flushNormalized();
        assert.strictEqual(res.ok, false);
        assert.strictEqual(res.error, 'rate_limited');
        assert.strictEqual(res.sent, 1, 'sent must report the count of deleted items');

        const remaining = window.KCData._loadQueue();
        assert.strictEqual(remaining.length, 2);
        assert.strictEqual(remaining[0].type, 'progress');
        assert.strictEqual(remaining[1].type, 'daily-goal');
        console.log('✓ flushNormalized handles mid-batch failure, retains unsent items and reports sent count');
    }

    // 10. fetchNormalizedProgress()
    {
        const { window } = createHarness({ kc_current_account: 'mia' });
        // without token
        const noToken = await window.KCData.fetchNormalizedProgress();
        assert.strictEqual(noToken.ok, false);
        assert.strictEqual(noToken.rows.length, 0);

        // with token but error
        window.KCCloud = {
            hasToken: () => true,
            report: async () => ({ ok: false, error: 'unauthorized' })
        };
        const fail = await window.KCData.fetchNormalizedProgress();
        assert.strictEqual(fail.ok, false);
        assert.strictEqual(fail.error, 'unauthorized');
        assert.strictEqual(fail.rows.length, 0);

        // with token and success
        window.KCCloud = {
            hasToken: () => true,
            report: async (days) => {
                assert.strictEqual(days, 30);
                return {
                    ok: true,
                    progress: [{ grade_level: 'k', subject_key: 'math', mastery: 90 }]
                };
            }
        };
        const good = await window.KCData.fetchNormalizedProgress();
        assert.strictEqual(good.ok, true);
        assert.strictEqual(good.rows.length, 1);
        assert.strictEqual(good.rows[0].mastery, 90);
        console.log('✓ fetchNormalizedProgress delegates to KCCloud.report(30)');
    }

    // 11. fetchRecentActivity()
    {
        const { window } = createHarness({ kc_current_account: 'mia' });
        const now = Date.now();
        const recentTs = now - 1000;
        const oldTs = now - (10 * 86400000);

        window.KCCloud = {
            hasToken: () => true,
            report: async (days) => {
                assert.strictEqual(days, 7);
                return {
                    ok: true,
                    events: [
                        { client_event_id: 'e1', created_at: recentTs },
                        { client_event_id: 'e2', created_at: oldTs }
                    ]
                };
            }
        };

        const res = await window.KCData.fetchRecentActivity();
        assert.strictEqual(res.ok, true);
        assert.strictEqual(res.rows.length, 1);
        assert.strictEqual(res.rows[0].client_event_id, 'e1');
        console.log('✓ fetchRecentActivity filters by created_at >= since');
    }

    // 12. fetchSkillActivity()
    {
        const { window } = createHarness({ kc_current_account: 'mia' });
        const now = Date.now();
        const recentIso = new Date(now - 1000).toISOString();

        window.KCCloud = {
            hasToken: () => true,
            report: async (days) => {
                assert.strictEqual(days, 30);
                return {
                    ok: true,
                    events: [
                        { client_event_id: 's1', created_at: recentIso, metadata: JSON.stringify({ skillId: 'k.math.1' }) },
                        { client_event_id: 's2', created_at: recentIso, metadata: { skillId: 'k.ela.1' } },
                        { client_event_id: 's3', created_at: recentIso, metadata: JSON.stringify({ other: 123 }) },
                        { client_event_id: 's4', created_at: new Date(now - 40 * 86400000).toISOString(), metadata: JSON.stringify({ skillId: 'k.math.2' }) }
                    ]
                };
            }
        };

        const res = await window.KCData.fetchSkillActivity(30);
        assert.strictEqual(res.ok, true);
        assert.strictEqual(res.rows.length, 2);
        assert.strictEqual(res.rows[0].client_event_id, 's1');
        assert.strictEqual(res.rows[1].client_event_id, 's2');
        console.log('✓ fetchSkillActivity filters by skillId and safely parses string metadata');
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
