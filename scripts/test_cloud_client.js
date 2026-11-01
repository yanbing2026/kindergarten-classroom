/**
 * Unit test for js/cloud-api.js (BlockQuest Cloud Client Transport Layer).
 * Zero external dependencies, offline, runs with node.
 * Conforms to docs/cloud-backend-d1.md.
 *
 * Run with: node scripts/test_cloud_client.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'js/cloud-api.js'), 'utf8');

function pass(name) {
  console.log(`PASS: ${name}`);
}

function createHarness(seedStorage = {}) {
  const store = new Map(Object.entries(seedStorage).map(([k, v]) => [k, String(v)]));
  const localStorage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
    clear: () => store.clear()
  };

  const timerRegistry = [];
  const mockSetTimeout = (fn, ms) => {
    const item = { id: timerRegistry.length + 1, fn, ms, cleared: false };
    timerRegistry.push(item);
    return item;
  };
  const mockClearTimeout = (item) => {
    if (item && typeof item === 'object') {
      item.cleared = true;
    }
  };

  const window = {
    localStorage
  };
  window.window = window;

  const context = vm.createContext({
    window,
    localStorage,
    console,
    setTimeout: mockSetTimeout,
    clearTimeout: mockClearTimeout,
    AbortController: typeof AbortController !== 'undefined' ? AbortController : undefined,
    Date,
    Math,
    JSON,
    String,
    Number,
    Object,
    Array,
    Set,
    Error,
    TypeError,
    SyntaxError,
    encodeURIComponent
  });

  vm.runInContext(SOURCE, context, { filename: 'js/cloud-api.js' });

  return {
    window,
    localStorage,
    store,
    timerRegistry,
    KCCloud: window.KCCloud
  };
}

(async () => {
  try {
    // -------------------------------------------------------------
    // Test 1: Request shape without token (/salt, POST, application/json, no Authorization)
    // -------------------------------------------------------------
    {
      const { KCCloud, localStorage } = createHarness();
      localStorage.clear();
      let captured = null;
      KCCloud._setFetch(async (url, opts) => {
        captured = { url, opts };
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, salt: 'random-salt-123' })
        };
      });

      const res = await KCCloud.salt('TestStudent');
      assert(captured, 'fetch must be called');
      assert.strictEqual(captured.url, 'https://blockquest-api.yanbing2004.workers.dev/salt');
      assert.strictEqual(captured.opts.method, 'POST');
      assert.strictEqual(captured.opts.headers['Content-Type'], 'application/json');
      assert.strictEqual(captured.opts.headers['Authorization'], undefined, 'No Authorization header when token is absent');
      assert.deepStrictEqual(JSON.parse(captured.opts.body), { name: 'TestStudent' });
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.salt, 'random-salt-123');

      pass('request shape without token (/salt, POST, Content-Type, no Authorization)');
    }

    // -------------------------------------------------------------
    // Test 2: Request shape with token (/me, GET, Bearer Authorization)
    // -------------------------------------------------------------
    {
      const { KCCloud, localStorage } = createHarness({
        kc_cloud_token_v1: 'token-abc-987'
      });
      assert.strictEqual(KCCloud.hasToken(), true);
      assert.strictEqual(KCCloud.getToken(), 'token-abc-987');

      let captured = null;
      KCCloud._setFetch(async (url, opts) => {
        captured = { url, opts };
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            name: 'Alice',
            playerId: 101,
            progress: { stars: 5 }
          })
        };
      });

      const res = await KCCloud.me();
      assert(captured, 'fetch must be called');
      assert.strictEqual(captured.url, 'https://blockquest-api.yanbing2004.workers.dev/me');
      assert.strictEqual(captured.opts.method, 'GET');
      assert.strictEqual(captured.opts.headers['Content-Type'], 'application/json');
      assert.strictEqual(captured.opts.headers['Authorization'], 'Bearer token-abc-987');
      assert.strictEqual(captured.opts.body, undefined, 'GET requests must not have a body');
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.playerId, 101);

      pass('request shape with token (/me, GET, Content-Type, Authorization Bearer)');
    }

    // -------------------------------------------------------------
    // Test 3: Custom Base URL via setBaseUrl
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      assert.strictEqual(KCCloud.BASE_URL, 'https://blockquest-api.yanbing2004.workers.dev');

      KCCloud.setBaseUrl('http://127.0.0.1:8787');
      assert.strictEqual(KCCloud.BASE_URL, 'http://127.0.0.1:8787');

      let capturedUrl = null;
      KCCloud._setFetch(async (url) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, salt: 's' })
        };
      });

      await KCCloud.salt('Bob');
      assert.strictEqual(capturedUrl, 'http://127.0.0.1:8787/salt');

      pass('setBaseUrl updates BASE_URL and request prefix');
    }

    // -------------------------------------------------------------
    // Test 4: login success writes token to localStorage & hasToken() sees it
    // -------------------------------------------------------------
    {
      const { KCCloud, localStorage } = createHarness();
      assert.strictEqual(KCCloud.hasToken(), false);

      KCCloud._setFetch(async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            name: 'Charlie',
            playerId: 42,
            token: 'jwt-login-charlie',
            progress: { xp: 100 }
          })
        };
      });

      const res = await KCCloud.login('Charlie', 'verifier_charlie');
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.token, 'jwt-login-charlie');
      assert.strictEqual(KCCloud.hasToken(), true);
      assert.strictEqual(KCCloud.getToken(), 'jwt-login-charlie');
      assert.strictEqual(localStorage.getItem('kc_cloud_token_v1'), 'jwt-login-charlie');

      pass('login success writes token to localStorage and hasToken() sees it');
    }

    // -------------------------------------------------------------
    // Test 5: create and rotatePin overwrite token on success
    // -------------------------------------------------------------
    {
      const { KCCloud, localStorage } = createHarness();
      localStorage.clear();

      KCCloud._setFetch(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          name: 'Dave',
          playerId: 77,
          token: 'token-created-dave'
        })
      }));

      const createRes = await KCCloud.create('Dave', 'verifier_dave', 'salt_dave', { k: 1 });
      assert.strictEqual(createRes.ok, true);
      assert.strictEqual(KCCloud.getToken(), 'token-created-dave');
      assert.strictEqual(localStorage.getItem('kc_cloud_token_v1'), 'token-created-dave');

      KCCloud._setFetch(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          token: 'token-rotated-dave'
        })
      }));

      const rotateRes = await KCCloud.rotatePin('verifier_dave', 'new_v', 'new_s');
      assert.strictEqual(rotateRes.ok, true);
      assert.strictEqual(KCCloud.getToken(), 'token-rotated-dave');
      assert.strictEqual(localStorage.getItem('kc_cloud_token_v1'), 'token-rotated-dave');

      pass('create and rotatePin overwrite token on success');
    }

    // -------------------------------------------------------------
    // Test 6: 401 unauthorized clears token
    // -------------------------------------------------------------
    {
      const { KCCloud, localStorage } = createHarness({
        kc_cloud_token_v1: 'token-to-be-cleared-unauth'
      });
      assert.strictEqual(KCCloud.hasToken(), true);

      KCCloud._setFetch(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ ok: false, error: 'unauthorized' })
      }));

      const res = await KCCloud.me();
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'unauthorized');
      assert.strictEqual(KCCloud.hasToken(), false);
      assert.strictEqual(KCCloud.getToken(), null);
      assert.strictEqual(localStorage.getItem('kc_cloud_token_v1'), null);

      pass('401 unauthorized clears token from localStorage');
    }

    // -------------------------------------------------------------
    // Test 7: 401 token_expired clears token
    // -------------------------------------------------------------
    {
      const { KCCloud, localStorage } = createHarness({
        kc_cloud_token_v1: 'token-to-be-cleared-expired'
      });
      assert.strictEqual(KCCloud.hasToken(), true);

      KCCloud._setFetch(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ ok: false, error: 'token_expired' })
      }));

      const res = await KCCloud.saveProgress({ math: 2 });
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'token_expired');
      assert.strictEqual(KCCloud.hasToken(), false);
      assert.strictEqual(KCCloud.getToken(), null);
      assert.strictEqual(localStorage.getItem('kc_cloud_token_v1'), null);

      pass('401 token_expired clears token from localStorage');
    }

    // -------------------------------------------------------------
    // Test 8: 401 with bad_credentials does NOT clear token
    // -------------------------------------------------------------
    {
      const { KCCloud, localStorage } = createHarness({
        kc_cloud_token_v1: 'still-valid-token'
      });
      assert.strictEqual(KCCloud.hasToken(), true);

      KCCloud._setFetch(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ ok: false, error: 'bad_credentials' })
      }));

      const res = await KCCloud.deletePlayer('wrong_verifier');
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'bad_credentials');
      assert.strictEqual(KCCloud.hasToken(), true);
      assert.strictEqual(KCCloud.getToken(), 'still-valid-token');
      assert.strictEqual(localStorage.getItem('kc_cloud_token_v1'), 'still-valid-token');

      pass('401 with bad_credentials does NOT clear token');
    }

    // -------------------------------------------------------------
    // Test 9: Network error (fake throws) returns {ok:false, error:'offline'} without throwing
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      KCCloud._setFetch(() => {
        return Promise.reject(new TypeError('Failed to fetch (DNS error)'));
      });

      const res = await KCCloud.salt('OfflineUser');
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'offline');

      pass("network error returns {ok:false, error:'offline'} without throwing");
    }

    // -------------------------------------------------------------
    // Test 10: 10-second timeout aborts request and returns {ok:false, error:'offline'}
    // -------------------------------------------------------------
    {
      const { KCCloud, timerRegistry } = createHarness();
      let signalReceived = null;

      KCCloud._setFetch((url, opts) => {
        signalReceived = opts.signal;
        return new Promise((resolve, reject) => {
          if (opts.signal) {
            opts.signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            });
          }
        });
      });

      const reqPromise = KCCloud.me();

      assert(signalReceived, 'AbortSignal must be passed to fetch');
      assert.strictEqual(timerRegistry.length, 1, '10s timer must be registered');
      const timer = timerRegistry[0];
      assert.strictEqual(timer.ms, 10000, 'Timeout must be exactly 10000 ms (10 seconds)');

      // Simulate 10-second timer trigger
      timer.fn();

      const res = await reqPromise;
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'offline');

      pass("10s timeout triggers abort and resolves to {ok:false, error:'offline'}");
    }

    // -------------------------------------------------------------
    // Test 11: Direct AbortError rejection returns {ok:false, error:'offline'} without throwing
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      KCCloud._setFetch(() => {
        const err = new Error('The user aborted a request');
        err.name = 'AbortError';
        return Promise.reject(err);
      });

      const res = await KCCloud.saveProgress({});
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'offline');

      pass("AbortError resolves to {ok:false, error:'offline'} without throwing");
    }

    // -------------------------------------------------------------
    // Test 12: Illegal JSON on 200 response resolves to {ok:false, error:'offline'}
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      KCCloud._setFetch(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        }
      }));

      const res = await KCCloud.me();
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'offline');

      pass("illegal JSON response on 200 resolves to {ok:false, error:'offline'}");
    }

    // -------------------------------------------------------------
    // Test 13: Server 409 name_taken returned verbatim
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      KCCloud._setFetch(async () => ({
        ok: false,
        status: 409,
        json: async () => ({ ok: false, error: 'name_taken' })
      }));

      const res = await KCCloud.create('taken_name', 'v', 's');
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'name_taken');

      pass('server 409 name_taken returned verbatim');
    }

    // -------------------------------------------------------------
    // Test 14: Server 500 without error field defaults to server_error
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      KCCloud._setFetch(async () => ({
        ok: false,
        status: 500,
        json: async () => ({})
      }));

      const res = await KCCloud.me();
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'server_error');

      pass('server 500 without error defaults to server_error');
    }

    // -------------------------------------------------------------
    // Test 15: sendEvents with 120 events -> exactly 3 requests (50, 50, 20), accepted: 120
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      const requests = [];

      KCCloud._setFetch(async (url, opts) => {
        const body = JSON.parse(opts.body);
        requests.push({ url, method: opts.method, body });
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, accepted: body.events.length })
        };
      });

      const events120 = Array.from({ length: 120 }, (_, i) => ({
        clientEventId: `evt-${i + 1}`,
        gradeLevel: 'K',
        subjectKey: 'math',
        unitKey: 'counting',
        eventType: 'question_answered',
        correct: 1
      }));

      const res = await KCCloud.sendEvents(events120);

      assert.strictEqual(requests.length, 3, 'Must make exactly 3 requests for 120 events');
      assert.strictEqual(requests[0].body.events.length, 50, 'Batch 1 must contain 50 events');
      assert.strictEqual(requests[1].body.events.length, 50, 'Batch 2 must contain 50 events');
      assert.strictEqual(requests[2].body.events.length, 20, 'Batch 3 must contain 20 events');
      assert.strictEqual(requests[0].url, 'https://blockquest-api.yanbing2004.workers.dev/events');
      assert.strictEqual(requests[0].method, 'POST');
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.accepted, 120);

      pass('sendEvents with 120 events batches into 50/50/20 and returns accepted:120');
    }

    // -------------------------------------------------------------
    // Test 16: sendEvents second batch failure -> {ok:false, error, accepted: 50}
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      let callCount = 0;

      KCCloud._setFetch(async (url, opts) => {
        callCount++;
        const body = JSON.parse(opts.body);
        if (callCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ ok: true, accepted: body.events.length })
          };
        }
        return {
          ok: false,
          status: 500,
          json: async () => ({ ok: false, error: 'd1_insert_failed' })
        };
      });

      const events120 = Array.from({ length: 120 }, (_, i) => ({
        clientEventId: `evt-${i + 1}`,
        correct: 1
      }));

      const res = await KCCloud.sendEvents(events120);

      assert.strictEqual(callCount, 2, 'Must stop sending after second batch fails');
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'd1_insert_failed');
      assert.strictEqual(res.accepted, 50, 'Must report accepted: 50 from batch 1');

      pass('sendEvents partial failure on batch 2 returns {ok:false, error, accepted:50}');
    }

    // -------------------------------------------------------------
    // Test 17: saveProgress body wraps progress and returns savedAt
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      let capturedBody = null;

      KCCloud._setFetch(async (url, opts) => {
        capturedBody = JSON.parse(opts.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, savedAt: 1730460000000 })
        };
      });

      const progressData = {
        ela: { stars: 3, mastery: 60 },
        math: { stars: 5, mastery: 100 }
      };

      const res = await KCCloud.saveProgress(progressData);
      assert.deepStrictEqual(capturedBody, {
        progress: {
          ela: { stars: 3, mastery: 60 },
          math: { stars: 5, mastery: 100 }
        }
      });
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.savedAt, 1730460000000);

      pass('saveProgress sends body matching {"progress":{...}} and returns savedAt');
    }

    // -------------------------------------------------------------
    // Test 18: report(7) URL contains ?days=7 and defaults to 30
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      const urls = [];

      KCCloud._setFetch(async (url) => {
        urls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, progress: [], events: [] })
        };
      });

      await KCCloud.report(7);
      assert(urls[0].endsWith('/report?days=7'), 'report(7) URL must end with /report?days=7');

      await KCCloud.report();
      assert(urls[1].endsWith('/report?days=30'), 'report() URL must default to ?days=30');

      pass('report(7) includes ?days=7 and defaults to ?days=30');
    }

    // -------------------------------------------------------------
    // Test 19: deletePlayer uses DELETE method and sends pinVerifier
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      let captured = null;

      KCCloud._setFetch(async (url, opts) => {
        captured = { url, opts, body: JSON.parse(opts.body) };
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true })
        };
      });

      const res = await KCCloud.deletePlayer('verifier_delete_target');
      assert(captured, 'fetch must be called');
      assert.strictEqual(captured.opts.method, 'DELETE');
      assert.strictEqual(captured.url, 'https://blockquest-api.yanbing2004.workers.dev/player');
      assert.deepStrictEqual(captured.body, { pinVerifier: 'verifier_delete_target' });
      assert.strictEqual(res.ok, true);

      pass('deletePlayer uses DELETE method with pinVerifier body');
    }

    // -------------------------------------------------------------
    // Test 20: _setFetch returns previous fetch implementation
    // -------------------------------------------------------------
    {
      const { KCCloud } = createHarness();
      const fake1 = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) });
      const fake2 = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) });

      const prev1 = KCCloud._setFetch(fake1);
      const prev2 = KCCloud._setFetch(fake2);
      assert.strictEqual(prev2, fake1, '_setFetch must return the previous fetch function');

      KCCloud._setFetch(prev1);

      pass('_setFetch returns previous fetch and allows restoration');
    }

    console.log('\nAll tests passed successfully.');
    process.exit(0);
  } catch (err) {
    console.error(`\nFAIL: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
})();
