/**
 * BlockQuest Classroom - Cloudflare Worker API
 * Provides authentication, progress synchronization, and activity logging backed by D1.
 * Conforms to docs/cloud-backend-d1.md.
 */

import { signToken, verifyToken, decodePayload, randomSalt, timingSafeEqual } from './auth.js';
import { createStore } from './store.js';

function computeCorsHeaders(request, allowedOriginsConfig) {
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };

  if (!origin) {
    headers['Access-Control-Allow-Origin'] = '*';
    return headers;
  }

  if (origin === 'null') {
    headers['Access-Control-Allow-Origin'] = 'null';
    return headers;
  }

  if (allowedOriginsConfig === '*' || !allowedOriginsConfig) {
    headers['Access-Control-Allow-Origin'] = origin;
    return headers;
  }

  const origins = allowedOriginsConfig.split(',').map(s => s.trim().toLowerCase());
  const originLower = origin.toLowerCase();

  const isAllowed = origins.some(allowed => {
    if (allowed === '*' || allowed === originLower) return true;
    if (allowed.startsWith('http://localhost') && originLower.startsWith('http://localhost')) return true;
    if (originLower.endsWith('.blockquest-classroom.pages.dev') || originLower === 'https://blockquest-classroom.pages.dev') return true;
    return false;
  });

  if (isAllowed) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

export function createApp({ store, now = () => Date.now(), secret = 'default-secret-change-me', allowedOrigins }) {
  if (!store) {
    throw new TypeError('Store instance is required');
  }

  const getNow = typeof now === 'function' ? now : () => (typeof now === 'number' ? now : Date.now());

  return async function handleRequest(request) {
    const cors = computeCorsHeaders(request, allowedOrigins);

    if (request.method.toUpperCase() === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...cors
        }
      });
    }

    async function authenticate() {
      const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: 'unauthorized', status: 401 };
      }
      const rawToken = authHeader.slice(7).trim();
      if (!rawToken) {
        return { error: 'unauthorized', status: 401 };
      }

      const unverified = decodePayload(rawToken);
      if (!unverified || !unverified.p) {
        return { error: 'unauthorized', status: 401 };
      }

      const player = await store.getById(unverified.p);
      if (!player) {
        return { error: 'unauthorized', status: 401 };
      }

      const tokenSecret = secret + ':' + player.pin_verifier;
      const currentSec = Math.floor(getNow() / 1000);
      const verifyResult = await verifyToken(rawToken, tokenSecret, currentSec);
      if (!verifyResult.valid) {
        if (verifyResult.error === 'expired') {
          return { error: 'token_expired', status: 401 };
        }
        return { error: 'unauthorized', status: 401 };
      }

      return { player };
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method.toUpperCase();

      // POST /salt
      if (method === 'POST' && path === '/salt') {
        let body;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }
        if (!body || typeof body.name !== 'string' || !body.name.trim()) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const nameKey = body.name.trim().toLowerCase();
        const player = await store.findByName(nameKey);
        if (player && player.pin_salt) {
          return jsonResponse({ ok: true, salt: player.pin_salt }, 200);
        }
        // Nonexistent user: return a random 16-byte base64 salt (two calls differ)
        return jsonResponse({ ok: true, salt: randomSalt(16) }, 200);
      }

      // POST /create
      if (method === 'POST' && path === '/create') {
        let body;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const { name, pinVerifier, salt, progress } = body || {};
        if (!name || typeof name !== 'string') {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }
        const trimmedName = name.trim();
        if (trimmedName.length < 1 || trimmedName.length > 20) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }
        if (!pinVerifier || typeof pinVerifier !== 'string' || !pinVerifier.trim()) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }
        if (!salt || typeof salt !== 'string' || !salt.trim()) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        let progressStr = '{}';
        if (progress !== undefined) {
          if (typeof progress !== 'object' || progress === null || Array.isArray(progress)) {
            return jsonResponse({ ok: false, error: 'bad_request' }, 400);
          }
          try {
            progressStr = JSON.stringify(progress);
          } catch {
            return jsonResponse({ ok: false, error: 'bad_request' }, 400);
          }
          if (progressStr.length > 65536) {
            return jsonResponse({ ok: false, error: 'bad_request' }, 400);
          }
        }

        const nameKey = trimmedName.toLowerCase();
        const existing = await store.findByName(nameKey);
        if (existing) {
          return jsonResponse({ ok: false, error: 'name_taken' }, 409);
        }

        const currentNow = getNow();
        let player;
        try {
          player = await store.insertPlayer({
            name: trimmedName,
            nameKey,
            pinVerifier: pinVerifier.trim(),
            pinSalt: salt.trim(),
            progress: progressStr,
            now: currentNow
          });
        } catch (err) {
          if (err && (err.code === 'SQLITE_CONSTRAINT' || String(err).includes('UNIQUE'))) {
            return jsonResponse({ ok: false, error: 'name_taken' }, 409);
          }
          throw err;
        }

        const tokenSecret = secret + ':' + player.pin_verifier;
        const token = await signToken(
          { p: player.id, exp: Math.floor(currentNow / 1000) + 30 * 86400 },
          tokenSecret
        );

        return jsonResponse({
          ok: true,
          name: player.name,
          playerId: player.id,
          token
        }, 200);
      }

      // POST /login
      if (method === 'POST' && path === '/login') {
        let body;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const { name, pinVerifier } = body || {};
        if (!name || typeof name !== 'string' || !name.trim()) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }
        if (!pinVerifier || typeof pinVerifier !== 'string' || !pinVerifier.trim()) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const trimmedName = name.trim();
        const nameKey = trimmedName.toLowerCase();
        const currentNow = getNow();

        // Rate limiting: 5 failed attempts in 60s, 6th is locked out
        const recentCount = await store.recentAttempts(nameKey, currentNow - 60000);
        if (recentCount >= 5) {
          return jsonResponse({ ok: false, error: 'locked_out' }, 429);
        }

        const player = await store.findByName(nameKey);
        if (!player) {
          await store.recordAttempt(nameKey, currentNow);
          return jsonResponse({ ok: false, error: 'bad_credentials' }, 401);
        }

        const match = timingSafeEqual(player.pin_verifier, pinVerifier.trim());
        if (!match) {
          await store.recordAttempt(nameKey, currentNow);
          return jsonResponse({ ok: false, error: 'bad_credentials' }, 401);
        }

        // Login success: clear attempts
        await store.clearAttempts(nameKey);

        const tokenSecret = secret + ':' + player.pin_verifier;
        const token = await signToken(
          { p: player.id, exp: Math.floor(currentNow / 1000) + 30 * 86400 },
          tokenSecret
        );

        let progressObj = {};
        try {
          progressObj = JSON.parse(player.progress || '{}');
        } catch {
          progressObj = {};
        }

        return jsonResponse({
          ok: true,
          name: player.name,
          playerId: player.id,
          token,
          progress: progressObj
        }, 200);
      }

      // GET /me
      if (method === 'GET' && path === '/me') {
        const auth = await authenticate();
        if (auth.error) {
          return jsonResponse({ ok: false, error: auth.error }, auth.status);
        }

        let progressObj = {};
        try {
          progressObj = JSON.parse(auth.player.progress || '{}');
        } catch {
          progressObj = {};
        }

        return jsonResponse({
          ok: true,
          name: auth.player.name,
          playerId: auth.player.id,
          progress: progressObj,
          updatedAt: auth.player.updated_at
        }, 200);
      }

      // POST /progress
      if (method === 'POST' && path === '/progress') {
        const auth = await authenticate();
        if (auth.error) {
          return jsonResponse({ ok: false, error: auth.error }, auth.status);
        }

        let body;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        if (!body || typeof body.progress !== 'object' || body.progress === null || Array.isArray(body.progress)) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        let progressStr;
        try {
          progressStr = JSON.stringify(body.progress);
        } catch {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }
        if (progressStr.length > 65536) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const savedAt = getNow();
        await store.updateProgress(auth.player.id, progressStr, savedAt);
        return jsonResponse({ ok: true, savedAt }, 200);
      }

      // POST /pin
      if (method === 'POST' && path === '/pin') {
        const auth = await authenticate();
        if (auth.error) {
          return jsonResponse({ ok: false, error: auth.error }, auth.status);
        }

        let body;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const { oldVerifier, newVerifier, newSalt } = body || {};
        if (!oldVerifier || typeof oldVerifier !== 'string' ||
            !newVerifier || typeof newVerifier !== 'string' ||
            !newSalt || typeof newSalt !== 'string' ||
            !oldVerifier.trim() || !newVerifier.trim() || !newSalt.trim()) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const match = timingSafeEqual(auth.player.pin_verifier, oldVerifier.trim());
        if (!match) {
          return jsonResponse({ ok: false, error: 'bad_credentials' }, 401);
        }

        const currentNow = getNow();
        const trimmedNewVerifier = newVerifier.trim();
        const trimmedNewSalt = newSalt.trim();

        await store.updatePin(auth.player.id, trimmedNewVerifier, trimmedNewSalt, currentNow);

        const newTokenSecret = secret + ':' + trimmedNewVerifier;
        const newToken = await signToken(
          { p: auth.player.id, exp: Math.floor(currentNow / 1000) + 30 * 86400 },
          newTokenSecret
        );

        return jsonResponse({ ok: true, token: newToken }, 200);
      }

      // DELETE /player
      if (method === 'DELETE' && path === '/player') {
        const auth = await authenticate();
        if (auth.error) {
          return jsonResponse({ ok: false, error: auth.error }, auth.status);
        }

        let body;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const { pinVerifier } = body || {};
        if (!pinVerifier || typeof pinVerifier !== 'string' || !pinVerifier.trim()) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const match = timingSafeEqual(auth.player.pin_verifier, pinVerifier.trim());
        if (!match) {
          return jsonResponse({ ok: false, error: 'bad_credentials' }, 401);
        }

        await store.deletePlayer(auth.player.id);
        return jsonResponse({ ok: true }, 200);
      }

      // POST /events
      if (method === 'POST' && path === '/events') {
        const auth = await authenticate();
        if (auth.error) {
          return jsonResponse({ ok: false, error: auth.error }, auth.status);
        }

        let body;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const { events } = body || {};
        if (!events || !Array.isArray(events)) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }
        if (events.length > 50) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        for (const e of events) {
          if (!e || typeof e !== 'object' || !(e.clientEventId || e.client_event_id)) {
            return jsonResponse({ ok: false, error: 'bad_request' }, 400);
          }
        }

        const accepted = await store.insertEvents(auth.player.id, events, getNow());
        return jsonResponse({ ok: true, accepted }, 200);
      }

      // POST /rows
      if (method === 'POST' && path === '/rows') {
        const auth = await authenticate();
        if (auth.error) {
          return jsonResponse({ ok: false, error: auth.error }, auth.status);
        }

        let body;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const { rows } = body || {};
        if (!rows || !Array.isArray(rows) || rows.length < 1 || rows.length > 200) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        for (const r of rows) {
          if (!r || typeof r !== 'object' || Array.isArray(r)) {
            return jsonResponse({ ok: false, error: 'bad_request' }, 400);
          }
          const grade = r.gradeLevel ?? r.grade_level;
          const subject = r.subjectKey ?? r.subject_key;
          if (grade === undefined || grade === null || grade === '' ||
              subject === undefined || subject === null || subject === '') {
            return jsonResponse({ ok: false, error: 'bad_request' }, 400);
          }
        }

        await store.upsertProgressRows(auth.player.id, rows, getNow());
        return jsonResponse({ ok: true, saved: rows.length }, 200);
      }

      // POST /goals
      if (method === 'POST' && path === '/goals') {
        const auth = await authenticate();
        if (auth.error) {
          return jsonResponse({ ok: false, error: auth.error }, auth.status);
        }

        let body;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        const { goals } = body || {};
        if (!goals || !Array.isArray(goals) || goals.length < 1 || goals.length > 50) {
          return jsonResponse({ ok: false, error: 'bad_request' }, 400);
        }

        for (const g of goals) {
          if (!g || typeof g !== 'object' || Array.isArray(g)) {
            return jsonResponse({ ok: false, error: 'bad_request' }, 400);
          }
          const date = g.goalDate ?? g.goal_date;
          if (date === undefined || date === null || date === '') {
            return jsonResponse({ ok: false, error: 'bad_request' }, 400);
          }
        }

        await store.upsertGoals(auth.player.id, goals, getNow());
        return jsonResponse({ ok: true, saved: goals.length }, 200);
      }

      // GET /report?days=30
      if (method === 'GET' && path === '/report') {
        const auth = await authenticate();
        if (auth.error) {
          return jsonResponse({ ok: false, error: auth.error }, auth.status);
        }

        const daysParam = url.searchParams.get('days') || '30';
        const daysNum = parseInt(daysParam, 10);
        const effectiveDays = (!isNaN(daysNum) && daysNum > 0) ? daysNum : 30;

        const currentNow = getNow();
        const sinceTs = currentNow - (effectiveDays * 24 * 60 * 60 * 1000);

        const events = await store.listEvents(auth.player.id, sinceTs);
        const progress = await store.listProgress(auth.player.id);
        const goals = await store.listGoals(auth.player.id);

        return jsonResponse({ ok: true, progress, events, goals }, 200);
      }

      return jsonResponse({ ok: false, error: 'not_found' }, 404);
    } catch (err) {
      console.error('Unhandled Worker error:', err);
      return jsonResponse({ ok: false, error: 'server_error' }, 500);
    }
  };
}

export default {
  async fetch(request, env) {
    const store = createStore(env.DB);
    const secret = env.TOKEN_SECRET || env.JWT_SECRET || env.AUTH_SECRET || 'default-secret-change-me';
    const allowedOrigins = env.ALLOWED_ORIGINS || '*';
    const app = createApp({
      store,
      now: () => Date.now(),
      secret,
      allowedOrigins
    });
    return app(request);
  }
};
