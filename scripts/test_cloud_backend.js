/**
 * Self-test for BlockQuest Cloudflare Worker + D1 Backend.
 * Zero external dependencies, runs offline with node.
 * Conforms to docs/cloud-backend-d1.md.
 *
 * Run with: node scripts/test_cloud_backend.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function pass(name) {
  console.log(`PASS: ${name}`);
}

(async () => {
  // Dynamically import ESM worker modules
  const { createApp } = await import('../worker/src/index.js');
  const { createMemoryStore } = await import('../worker/src/memory-store.js');
  const { signToken, verifyToken, randomSalt, timingSafeEqual, decodePayload } = await import('../worker/src/auth.js');
  const { createStore } = await import('../worker/src/store.js');

  const SECRET = 'test-token-secret-blockquest-2026';
  const ALLOWED_ORIGINS = 'https://blockquest-classroom.pages.dev,http://localhost:3000,http://localhost:8080';

  // -------------------------------------------------------------
  // Test 1: auth.js low-level functions
  // -------------------------------------------------------------
  {
    assert.strictEqual(timingSafeEqual('hello', 'hello'), true);
    assert.strictEqual(timingSafeEqual('hello', 'world'), false);
    assert.strictEqual(timingSafeEqual('hello', 'hell'), false);

    const salt1 = randomSalt(16);
    const salt2 = randomSalt(16);
    assert.strictEqual(typeof salt1, 'string');
    assert.strictEqual(typeof salt2, 'string');
    assert.notStrictEqual(salt1, salt2, 'Random salts must differ');

    const token = await signToken({ p: 101, exp: Math.floor(Date.now() / 1000) + 3600 }, SECRET);
    const parts = token.split('.');
    assert.strictEqual(parts.length, 2, 'Token must be base64url.base64url');

    const decoded = decodePayload(token);
    assert.strictEqual(decoded.p, 101);

    const validResult = await verifyToken(token, SECRET);
    assert.strictEqual(validResult.valid, true);
    assert.strictEqual(validResult.payload.p, 101);

    const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'b' : 'a') + token.slice(-1);
    const tamperedResult = await verifyToken(tampered, SECRET);
    assert.strictEqual(tamperedResult.valid, false);
    assert.strictEqual(tamperedResult.error, 'invalid');

    const expiredToken = await signToken({ p: 101, exp: Math.floor(Date.now() / 1000) - 100 }, SECRET);
    const expiredResult = await verifyToken(expiredToken, SECRET);
    assert.strictEqual(expiredResult.valid, false);
    assert.strictEqual(expiredResult.error, 'expired');

    pass('auth.js timingSafeEqual, signToken, and verifyToken contracts verified');
  }

  // -------------------------------------------------------------
  // Test 2: CORS and OPTIONS preflight
  // -------------------------------------------------------------
  {
    let currentTime = 1700000000000;
    const store = createMemoryStore();
    const app = createApp({
      store,
      now: () => currentTime,
      secret: SECRET,
      allowedOrigins: ALLOWED_ORIGINS
    });

    // OPTIONS preflight
    const optReq = new Request('http://localhost/salt', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://blockquest-classroom.pages.dev',
        'Access-Control-Request-Method': 'POST'
      }
    });
    const optRes = await app(optReq);
    assert.strictEqual(optRes.status, 204);
    assert.strictEqual(optRes.headers.get('Access-Control-Allow-Origin'), 'https://blockquest-classroom.pages.dev');
    assert(optRes.headers.get('Access-Control-Allow-Methods').includes('POST'));
    pass('OPTIONS returns 204 with CORS headers');

    // CORS allows null origin (file:// origin)
    const nullOptReq = new Request('http://localhost/salt', {
      method: 'OPTIONS',
      headers: { Origin: 'null' }
    });
    const nullOptRes = await app(nullOptReq);
    assert.strictEqual(nullOptRes.status, 204);
    assert.strictEqual(nullOptRes.headers.get('Access-Control-Allow-Origin'), 'null');
    pass('CORS allows null origin');

    // CORS allows preview subdomains
    const previewReq = new Request('http://localhost/salt', {
      method: 'OPTIONS',
      headers: { Origin: 'https://preview-123.blockquest-classroom.pages.dev' }
    });
    const previewRes = await app(previewReq);
    assert.strictEqual(previewRes.status, 204);
    assert.strictEqual(previewRes.headers.get('Access-Control-Allow-Origin'), 'https://preview-123.blockquest-classroom.pages.dev');
    pass('CORS allows Pages preview subdomains');
  }

  // -------------------------------------------------------------
  // Test 3: POST /salt anti-enumeration
  // -------------------------------------------------------------
  {
    let currentTime = 1700000000000;
    const store = createMemoryStore();
    const app = createApp({
      store,
      now: () => currentTime,
      secret: SECRET,
      allowedOrigins: ALLOWED_ORIGINS
    });

    const res1 = await app(new Request('http://localhost/salt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'NonExistentUser' })
    }));
    assert.strictEqual(res1.status, 200);
    const body1 = await res1.json();
    assert.strictEqual(body1.ok, true);
    assert.strictEqual(typeof body1.salt, 'string');

    const res2 = await app(new Request('http://localhost/salt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'NonExistentUser' })
    }));
    assert.strictEqual(res2.status, 200);
    const body2 = await res2.json();
    assert.strictEqual(body2.ok, true);
    assert.notStrictEqual(body1.salt, body2.salt, '/salt must return different random salts on successive calls for nonexistent user');

    // Missing name -> 400 bad_request
    const badSaltRes = await app(new Request('http://localhost/salt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }));
    assert.strictEqual(badSaltRes.status, 400);
    const badSaltBody = await badSaltRes.json();
    assert.strictEqual(badSaltBody.ok, false);
    assert.strictEqual(badSaltBody.error, 'bad_request');

    pass('/salt returns 200 with differing random salts for nonexistent user (anti-enumeration)');
  }

  // -------------------------------------------------------------
  // Test 4: POST /create validation, uniqueness, and case-insensitivity
  // -------------------------------------------------------------
  {
    let currentTime = 1700000000000;
    const store = createMemoryStore();
    const app = createApp({
      store,
      now: () => currentTime,
      secret: SECRET,
      allowedOrigins: ALLOWED_ORIGINS
    });

    // Invalid name: empty
    const emptyNameRes = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ', pinVerifier: 'verifier123', salt: 'salt123' })
    }));
    assert.strictEqual(emptyNameRes.status, 400);

    // Invalid name: > 20 chars
    const longNameRes = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'ThisNameIsWayTooLongForAChild', pinVerifier: 'verifier123', salt: 'salt123' })
    }));
    assert.strictEqual(longNameRes.status, 400);

    // Missing verifier
    const noVerifierRes = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', salt: 'salt123' })
    }));
    assert.strictEqual(noVerifierRes.status, 400);

    // Successful create
    const createRes = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '  Alice  ',
        pinVerifier: 'verifier_alice_1',
        salt: 'salt_alice_1',
        progress: { letters: { stars: 3 } }
      })
    }));
    assert.strictEqual(createRes.status, 200);
    const createBody = await createRes.json();
    assert.strictEqual(createBody.ok, true);
    assert.strictEqual(createBody.name, 'Alice');
    assert.strictEqual(typeof createBody.playerId, 'number');
    assert.strictEqual(typeof createBody.token, 'string');

    // Existing user /salt should now return stored salt
    const saltRes = await app(new Request('http://localhost/salt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'alice' })
    }));
    assert.strictEqual(saltRes.status, 200);
    const saltBody = await saltRes.json();
    assert.strictEqual(saltBody.salt, 'salt_alice_1');

    // Duplicate name: exact match -> 409 name_taken
    const dupRes1 = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', pinVerifier: 'v2', salt: 's2' })
    }));
    assert.strictEqual(dupRes1.status, 409);
    const dupBody1 = await dupRes1.json();
    assert.strictEqual(dupBody1.ok, false);
    assert.strictEqual(dupBody1.error, 'name_taken');

    // Duplicate name: different casing ('alice' vs 'Alice') -> 409 name_taken
    const dupRes2 = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'ALICE', pinVerifier: 'v3', salt: 's3' })
    }));
    assert.strictEqual(dupRes2.status, 409);
    const dupBody2 = await dupRes2.json();
    assert.strictEqual(dupBody2.ok, false);
    assert.strictEqual(dupBody2.error, 'name_taken');

    pass('/create validates name length and rejects case-insensitive duplicates with 409 name_taken');
  }

  // -------------------------------------------------------------
  // Test 5: POST /login credentials check
  // -------------------------------------------------------------
  {
    let currentTime = 1700000000000;
    const store = createMemoryStore();
    const app = createApp({
      store,
      now: () => currentTime,
      secret: SECRET,
      allowedOrigins: ALLOWED_ORIGINS
    });

    await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob',
        pinVerifier: 'correct_verifier_bob',
        salt: 'salt_bob',
        progress: { math: { stars: 10 } }
      })
    }));

    // Nonexistent user login -> 401 bad_credentials
    const badUserRes = await app(new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Charlie', pinVerifier: 'some_verifier' })
    }));
    assert.strictEqual(badUserRes.status, 401);
    const badUserBody = await badUserRes.json();
    assert.strictEqual(badUserBody.ok, false);
    assert.strictEqual(badUserBody.error, 'bad_credentials');

    // Wrong verifier -> 401 bad_credentials
    const wrongPinRes = await app(new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob', pinVerifier: 'wrong_verifier' })
    }));
    assert.strictEqual(wrongPinRes.status, 401);
    const wrongPinBody = await wrongPinRes.json();
    assert.strictEqual(wrongPinBody.ok, false);
    assert.strictEqual(wrongPinBody.error, 'bad_credentials');

    // Correct login -> 200 + token + latest progress
    const goodLoginRes = await app(new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'bob', pinVerifier: 'correct_verifier_bob' })
    }));
    assert.strictEqual(goodLoginRes.status, 200);
    const goodLoginBody = await goodLoginRes.json();
    assert.strictEqual(goodLoginBody.ok, true);
    assert.strictEqual(goodLoginBody.name, 'Bob');
    assert.strictEqual(typeof goodLoginBody.token, 'string');
    assert.deepStrictEqual(goodLoginBody.progress, { math: { stars: 10 } });

    pass('/login rejects wrong verifier with 401 bad_credentials and succeeds with token and progress');
  }

  // -------------------------------------------------------------
  // Test 6: Rate Limiting on /login (5 fails in 60s, 6th is 429 locked_out, 61s recovery)
  // -------------------------------------------------------------
  {
    let currentTime = 1700000000000;
    const store = createMemoryStore();
    const app = createApp({
      store,
      now: () => currentTime,
      secret: SECRET,
      allowedOrigins: ALLOWED_ORIGINS
    });

    await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dave', pinVerifier: 'correct_dave_pin', salt: 'salt_dave' })
    }));

    // 5 consecutive failures
    for (let i = 1; i <= 5; i++) {
      const res = await app(new Request('http://localhost/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Dave', pinVerifier: `wrong_pin_${i}` })
      }));
      assert.strictEqual(res.status, 401, `Failure ${i} must be 401`);
      const body = await res.json();
      assert.strictEqual(body.error, 'bad_credentials');
    }

    // 6th attempt within 60s, even with CORRECT PIN -> 429 locked_out
    const lockedRes = await app(new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dave', pinVerifier: 'correct_dave_pin' })
    }));
    assert.strictEqual(lockedRes.status, 429, '6th attempt must be 429 locked_out');
    const lockedBody = await lockedRes.json();
    assert.strictEqual(lockedBody.ok, false);
    assert.strictEqual(lockedBody.error, 'locked_out');

    // Advance clock by 61 seconds (beyond the 60-second window)
    currentTime += 61000;

    // Now attempt with correct PIN -> should succeed and clear attempts
    const recoveredRes = await app(new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dave', pinVerifier: 'correct_dave_pin' })
    }));
    assert.strictEqual(recoveredRes.status, 200, 'Login after 61s window must recover');
    const recoveredBody = await recoveredRes.json();
    assert.strictEqual(recoveredBody.ok, true);

    pass('Rate limiting locks out on 6th failed attempt in 60s window (429 locked_out) and recovers after 61s');
  }

  // -------------------------------------------------------------
  // Test 7: Bearer Auth validation (missing header, tampered signature, expired token)
  // -------------------------------------------------------------
  {
    let currentTime = 1700000000000;
    const store = createMemoryStore();
    const app = createApp({
      store,
      now: () => currentTime,
      secret: SECRET,
      allowedOrigins: ALLOWED_ORIGINS
    });

    const createRes = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Eva', pinVerifier: 'eva_pin', salt: 'eva_salt' })
    }));
    const { token, playerId } = await createRes.json();

    // 1. Missing Authorization header -> 401 unauthorized
    const noHeaderRes = await app(new Request('http://localhost/me'));
    assert.strictEqual(noHeaderRes.status, 401);
    const noHeaderBody = await noHeaderRes.json();
    assert.strictEqual(noHeaderBody.error, 'unauthorized');

    // 2. Malformed Authorization header -> 401 unauthorized
    const badHeaderRes = await app(new Request('http://localhost/me', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' }
    }));
    assert.strictEqual(badHeaderRes.status, 401);

    // 3. Tampered signature -> 401 unauthorized
    const [payloadB64, sigB64] = token.split('.');
    const tamperedSig = sigB64.slice(0, -2) + (sigB64.endsWith('x') ? 'y' : 'x') + sigB64.slice(-1);
    const tamperedToken = `${payloadB64}.${tamperedSig}`;
    const tamperedRes = await app(new Request('http://localhost/me', {
      headers: { Authorization: `Bearer ${tamperedToken}` }
    }));
    assert.strictEqual(tamperedRes.status, 401);
    const tamperedBody = await tamperedRes.json();
    assert.strictEqual(tamperedBody.error, 'unauthorized');

    // 4. Expired token -> 401 token_expired
    const expiredToken = await signToken(
      { p: playerId, exp: Math.floor(currentTime / 1000) - 60 },
      SECRET + ':eva_pin'
    );
    const expiredRes = await app(new Request('http://localhost/me', {
      headers: { Authorization: `Bearer ${expiredToken}` }
    }));
    assert.strictEqual(expiredRes.status, 401);
    const expiredBody = await expiredRes.json();
    assert.strictEqual(expiredBody.error, 'token_expired');

    pass('Bearer auth enforces missing header, tampered signature, and expiration with 401 unauthorized/token_expired');
  }

  // -------------------------------------------------------------
  // Test 8: POST /progress and GET /me (stores JSON string, returns object)
  // -------------------------------------------------------------
  {
    let currentTime = 1700000000000;
    const store = createMemoryStore();
    const app = createApp({
      store,
      now: () => currentTime,
      secret: SECRET,
      allowedOrigins: ALLOWED_ORIGINS
    });

    const createRes = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Frank', pinVerifier: 'frank_pin', salt: 'frank_salt' })
    }));
    const { token } = await createRes.json();

    // Initial /me
    const me1 = await app(new Request('http://localhost/me', {
      headers: { Authorization: `Bearer ${token}` }
    }));
    assert.strictEqual(me1.status, 200);
    const meBody1 = await me1.json();
    assert.deepStrictEqual(meBody1.progress, {});

    // Save progress
    currentTime += 5000;
    const saveRes = await app(new Request('http://localhost/progress', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        progress: {
          letters: { stars: 12, mastery: 85 },
          math: { stars: 20 }
        }
      })
    }));
    assert.strictEqual(saveRes.status, 200);
    const saveBody = await saveRes.json();
    assert.strictEqual(saveBody.ok, true);
    assert.strictEqual(saveBody.savedAt, currentTime);

    // Fetch /me: progress must be returned as parsed Object, not a string
    const me2 = await app(new Request('http://localhost/me', {
      headers: { Authorization: `Bearer ${token}` }
    }));
    assert.strictEqual(me2.status, 200);
    const meBody2 = await me2.json();
    assert.strictEqual(typeof meBody2.progress, 'object');
    assert.strictEqual(Array.isArray(meBody2.progress), false);
    assert.strictEqual(meBody2.progress.letters.stars, 12);
    assert.strictEqual(meBody2.progress.math.stars, 20);

    pass('/progress stores JSON and /me returns parsed progress object');
  }

  // -------------------------------------------------------------
  // Test 9: POST /pin (oldVerifier verification and immediate old token invalidation)
  // -------------------------------------------------------------
  {
    let currentTime = 1700000000000;
    const store = createMemoryStore();
    const app = createApp({
      store,
      now: () => currentTime,
      secret: SECRET,
      allowedOrigins: ALLOWED_ORIGINS
    });

    const createRes = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Grace', pinVerifier: 'grace_old_pin', salt: 'grace_old_salt' })
    }));
    const { token: oldToken } = await createRes.json();

    // Verify old token works before pin change
    const check1 = await app(new Request('http://localhost/me', {
      headers: { Authorization: `Bearer ${oldToken}` }
    }));
    assert.strictEqual(check1.status, 200);

    // Wrong oldVerifier -> 401 bad_credentials
    const badPinRes = await app(new Request('http://localhost/pin', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${oldToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldVerifier: 'wrong_old_pin',
        newVerifier: 'grace_new_pin',
        newSalt: 'grace_new_salt'
      })
    }));
    assert.strictEqual(badPinRes.status, 401);
    const badPinBody = await badPinRes.json();
    assert.strictEqual(badPinBody.error, 'bad_credentials');

    // Correct oldVerifier -> 200 + new token
    const goodPinRes = await app(new Request('http://localhost/pin', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${oldToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldVerifier: 'grace_old_pin',
        newVerifier: 'grace_new_pin',
        newSalt: 'grace_new_salt'
      })
    }));
    assert.strictEqual(goodPinRes.status, 200);
    const { token: newToken } = await goodPinRes.json();
    assert.strictEqual(typeof newToken, 'string');
    assert.notStrictEqual(oldToken, newToken);

    // Old token must IMMEDIATELY fail with 401 unauthorized
    const oldTokCheck = await app(new Request('http://localhost/me', {
      headers: { Authorization: `Bearer ${oldToken}` }
    }));
    assert.strictEqual(oldTokCheck.status, 401, 'Old token must be rejected after PIN change');
    const oldTokBody = await oldTokCheck.json();
    assert.strictEqual(oldTokBody.error, 'unauthorized');

    // New token works
    const newTokCheck = await app(new Request('http://localhost/me', {
      headers: { Authorization: `Bearer ${newToken}` }
    }));
    assert.strictEqual(newTokCheck.status, 200);

    pass('/pin checks old verifier and immediately invalidates old token upon success');
  }

  // -------------------------------------------------------------
  // Test 10: POST /events (<=50 items, idempotency on clientEventId)
  // -------------------------------------------------------------
  {
    let currentTime = 1700000000000;
    const store = createMemoryStore();
    const app = createApp({
      store,
      now: () => currentTime,
      secret: SECRET,
      allowedOrigins: ALLOWED_ORIGINS
    });

    const createRes = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hannah', pinVerifier: 'hannah_pin', salt: 'hannah_salt' })
    }));
    const { token, playerId } = await createRes.json();

    // Over 50 events -> 400 bad_request
    const over50 = [];
    for (let i = 0; i < 51; i++) {
      over50.push({ clientEventId: `evt_${i}`, gradeLevel: 'k', eventType: 'answer' });
    }
    const overRes = await app(new Request('http://localhost/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events: over50 })
    }));
    assert.strictEqual(overRes.status, 400);
    const overBody = await overRes.json();
    assert.strictEqual(overBody.error, 'bad_request');

    // Valid batch: 2 events
    const batch1 = [
      { clientEventId: 'client-evt-1', gradeLevel: 'k', score: 10, correct: true },
      { clientEventId: 'client-evt-2', gradeLevel: 'k', score: 20, correct: true }
    ];
    const res1 = await app(new Request('http://localhost/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events: batch1 })
    }));
    assert.strictEqual(res1.status, 200);

    // Resend batch with duplicate client-evt-1 and new client-evt-3 -> idempotent!
    const batch2 = [
      { clientEventId: 'client-evt-1', gradeLevel: 'k', score: 10, correct: true },
      { clientEventId: 'client-evt-3', gradeLevel: 'k', score: 30, correct: true }
    ];
    const res2 = await app(new Request('http://localhost/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events: batch2 })
    }));
    assert.strictEqual(res2.status, 200, 'Duplicate clientEventId must be handled idempotently');

    const allEvents = await store.listEvents(playerId, 0);
    assert.strictEqual(allEvents.length, 3, 'Total events stored should be 3 (no duplicate client-evt-1)');

    pass('/events enforces 50 item maximum and guarantees idempotency on clientEventId');
  }

  // -------------------------------------------------------------
  // Test 11: GET /report?days=30 window filtering
  // -------------------------------------------------------------
  {
    let currentTime = 1700000000000;
    const store = createMemoryStore();
    const app = createApp({
      store,
      now: () => currentTime,
      secret: SECRET,
      allowedOrigins: ALLOWED_ORIGINS
    });

    const createRes = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ian', pinVerifier: 'ian_pin', salt: 'ian_salt' })
    }));
    const { token, playerId } = await createRes.json();

    // Event 1: 5 days ago (within 30 days)
    const fiveDaysAgo = currentTime - (5 * 24 * 60 * 60 * 1000);
    await store.insertEvents(playerId, [{ clientEventId: 'evt_recent', gradeLevel: '1' }], fiveDaysAgo);

    // Event 2: 45 days ago (outside 30 days)
    const fortyFiveDaysAgo = currentTime - (45 * 24 * 60 * 60 * 1000);
    await store.insertEvents(playerId, [{ clientEventId: 'evt_old', gradeLevel: '1' }], fortyFiveDaysAgo);

    const reportRes = await app(new Request('http://localhost/report?days=30', {
      headers: { Authorization: `Bearer ${token}` }
    }));
    assert.strictEqual(reportRes.status, 200);
    const reportBody = await reportRes.json();
    assert.strictEqual(reportBody.ok, true);
    assert.strictEqual(Array.isArray(reportBody.events), true);
    assert.strictEqual(reportBody.events.length, 1);
    assert.strictEqual(reportBody.events[0].client_event_id, 'evt_recent');

    pass('/report?days=30 returns only events within the specified time window');
  }

  // -------------------------------------------------------------
  // Test 12: DELETE /player (cascades delete, subsequent login/me fail)
  // -------------------------------------------------------------
  {
    let currentTime = 1700000000000;
    const store = createMemoryStore();
    const app = createApp({
      store,
      now: () => currentTime,
      secret: SECRET,
      allowedOrigins: ALLOWED_ORIGINS
    });

    const createRes = await app(new Request('http://localhost/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jack', pinVerifier: 'jack_pin', salt: 'jack_salt' })
    }));
    const { token, playerId } = await createRes.json();

    // Add progress and event for Jack
    await store.upsertProgressRows(playerId, [{ gradeLevel: 'k', stars: 5 }], currentTime);
    await store.insertEvents(playerId, [{ clientEventId: 'jack_evt_1' }], currentTime);

    // Wrong pinVerifier on delete -> 401 bad_credentials
    const badDelete = await app(new Request('http://localhost/player', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pinVerifier: 'wrong_jack_pin' })
    }));
    assert.strictEqual(badDelete.status, 401);
    const badDeleteBody = await badDelete.json();
    assert.strictEqual(badDeleteBody.error, 'bad_credentials');

    // Correct pinVerifier -> 200
    const goodDelete = await app(new Request('http://localhost/player', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pinVerifier: 'jack_pin' })
    }));
    assert.strictEqual(goodDelete.status, 200);
    const goodDeleteBody = await goodDelete.json();
    assert.strictEqual(goodDeleteBody.ok, true);

    // Subsequent /login -> 401 bad_credentials
    const loginAfterDelete = await app(new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jack', pinVerifier: 'jack_pin' })
    }));
    assert.strictEqual(loginAfterDelete.status, 401);
    const loginAfterDeleteBody = await loginAfterDelete.json();
    assert.strictEqual(loginAfterDeleteBody.error, 'bad_credentials');

    // Subsequent /me with old token -> 401 unauthorized
    const meAfterDelete = await app(new Request('http://localhost/me', {
      headers: { Authorization: `Bearer ${token}` }
    }));
    assert.strictEqual(meAfterDelete.status, 401);

    // Data cascaded: progress and events gone
    const remainingEvents = await store.listEvents(playerId, 0);
    assert.strictEqual(remainingEvents.length, 0);
    const remainingProgress = await store.listProgress(playerId);
    assert.strictEqual(remainingProgress.length, 0);

    pass('DELETE /player verifies credentials, cascades deletions, and blocks subsequent access');
  }

  // -------------------------------------------------------------
  // Test 13: D1 SQLite Store (store.js + schema.sql validation)
  // -------------------------------------------------------------
  {
    const { DatabaseSync } = require('node:sqlite');
    const sqliteDb = new DatabaseSync(':memory:');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../worker/schema.sql'), 'utf8');

    // Execute schema.sql against SQLite
    sqliteDb.exec(schemaSql);

    // D1 emulation wrapper
    const d1Mock = {
      prepare(sql) {
        return {
          _params: [],
          bind(...params) {
            this._params = params;
            return this;
          },
          async first() {
            const stmt = sqliteDb.prepare(sql);
            const row = stmt.get(...this._params);
            return row || null;
          },
          async all() {
            const stmt = sqliteDb.prepare(sql);
            const results = stmt.all(...this._params);
            return { results: results || [] };
          },
          async run() {
            const stmt = sqliteDb.prepare(sql);
            const info = stmt.run(...this._params);
            return {
              meta: {
                last_row_id: info.lastInsertRowid ? Number(info.lastInsertRowid) : 0,
                changes: info.changes
              }
            };
          }
        };
      },
      async batch(stmts) {
        for (const s of stmts) {
          await s.run();
        }
      }
    };

    const d1Store = createStore(d1Mock);
    const now = 1700000000000;

    // insertPlayer
    const player = await d1Store.insertPlayer({
      name: 'SQLPlayer',
      nameKey: 'sqlplayer',
      pinVerifier: 'verifier_sql',
      pinSalt: 'salt_sql',
      progress: '{"level":1}',
      now
    });
    assert.strictEqual(player.id, 1);
    assert.strictEqual(player.name, 'SQLPlayer');

    // findByName and getById
    const foundByName = await d1Store.findByName('sqlplayer');
    assert.strictEqual(foundByName.id, 1);
    const foundById = await d1Store.getById(1);
    assert.strictEqual(foundById.name, 'SQLPlayer');

    // updateProgress and updatePin
    await d1Store.updateProgress(1, '{"level":2}', now + 100);
    const updatedProg = await d1Store.getById(1);
    assert.strictEqual(updatedProg.progress, '{"level":2}');

    await d1Store.updatePin(1, 'verifier_new', 'salt_new', now + 200);
    const updatedPin = await d1Store.getById(1);
    assert.strictEqual(updatedPin.pin_verifier, 'verifier_new');

    // upsertProgressRows and listProgress
    await d1Store.upsertProgressRows(1, [
      { gradeLevel: 'k', subjectKey: 'math', unitKey: 'count', mastery: 80, stars: 3 }
    ], now);
    const progressList = await d1Store.listProgress(1);
    assert.strictEqual(progressList.length, 1);
    assert.strictEqual(progressList[0].mastery, 80);

    // insertEvents and listEvents
    await d1Store.insertEvents(1, [
      { clientEventId: 'sql_evt_1', score: 100, createdAt: now + 50 },
      { clientEventId: 'sql_evt_1', score: 100, createdAt: now + 50 } // duplicate
    ], now);
    const events = await d1Store.listEvents(1, now);
    assert.strictEqual(events.length, 1, 'Duplicate client_event_id must be ignored');

    // login attempts
    await d1Store.recordAttempt('sqlplayer', now);
    await d1Store.recordAttempt('sqlplayer', now + 10);
    const attempts = await d1Store.recentAttempts('sqlplayer', now);
    assert.strictEqual(attempts, 2);
    await d1Store.clearAttempts('sqlplayer');
    const attemptsAfterClear = await d1Store.recentAttempts('sqlplayer', now);
    assert.strictEqual(attemptsAfterClear, 0);

    // deletePlayer
    await d1Store.deletePlayer(1);
    assert.strictEqual(await d1Store.getById(1), null);
    assert.strictEqual((await d1Store.listEvents(1, 0)).length, 0);
    assert.strictEqual((await d1Store.listProgress(1)).length, 0);

    pass('worker/src/store.js executes cleanly against SQLite schema.sql');
  }

  console.log('\nAll Cloudflare Worker + D1 backend tests PASSED! ✅');
})().catch(err => {
  console.error('\nFAIL:', err);
  process.exit(1);
});
