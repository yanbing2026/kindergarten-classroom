(function () {
  'use strict';

  // BlockQuest Classroom data layer.
  // This is deliberately a compatibility-first layer: localStorage remains the
  // source of truth for the existing app while cloud tables are
  // adopted incrementally. It never stores a PIN.
  const VERSION = 1;
  const QUEUE_KEY = 'kc_data_queue_v1';
  const SNAPSHOT_KEY = 'kc_data_snapshot_v1';
  const ACCOUNT_KEY = 'kc_current_account';
  const ACCOUNTS_KEY = 'kc_accounts_v1';
  const PLAYER_ID_KEY = 'kc_normalized_player_id_v1';

  const safeJson = (value, fallback) => {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  };

  // `kc_current_account` is written by index.html as a lowercase account key,
  // while older builds wrote a JSON object. Accept both shapes: the queue and
  // the normalized sync are scoped by account name, so this must never be null
  // when an account is selected.
  function currentAccount() {
    const raw = String(localStorage.getItem(ACCOUNT_KEY) || '').trim();
    if (!raw) return null;
    if (raw.charAt(0) === '{') {
      const parsed = safeJson(raw, null);
      if (parsed && parsed.name) return { key: String(parsed.key || parsed.name).toLowerCase(), name: String(parsed.name) };
    }
    const key = raw.toLowerCase();
    const accounts = safeJson(localStorage.getItem(ACCOUNTS_KEY) || '{}', {});
    const stored = accounts && accounts[key];
    return { key, name: stored && stored.name ? String(stored.name) : key };
  }

  function loadQueue() {
    return safeJson(localStorage.getItem(QUEUE_KEY) || '[]', []);
  }

  function saveQueue(queue) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-100))); } catch (_) {}
  }

  function makeQueueId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
    } catch (_) {}
    return 'evt-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function enqueue(type, payload) {
    const queue = loadQueue();
    queue.push({
      id: makeQueueId(),
      type,
      payload,
      accountKey: String(currentAccount()?.name || '').trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      version: VERSION
    });
    saveQueue(queue);
    return queue[queue.length - 1];
  }

  function localSnapshot(progress) {
    const snapshot = {
      version: VERSION,
      savedAt: new Date().toISOString(),
      account: currentAccount(),
      progress: progress || null
    };
    try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot)); } catch (_) {}
    return snapshot;
  }

  function readSnapshot() {
    return safeJson(localStorage.getItem(SNAPSHOT_KEY) || '', null);
  }

  async function syncLegacyProgress(progress) {
    // Existing account RPC remains the compatibility cloud path.
    // Normalized tables are not written here.
    if (typeof window.cloudSaveProgress !== 'function') {
      return { ok:false, skipped:true, reason:'legacy cloud bridge unavailable' };
    }
    try {
      const account = currentAccount();
      if (!account?.name) return { ok:false, skipped:true, reason:'no account selected' };
      const result = await window.cloudSaveProgress(account.name, progress);
      // cloudSaveProgress returns { ok, reason } in current builds and a plain
      // boolean in older ones; both must not be read as "true" when the RPC
      // failed, or a failed sync would be reported as saved.
      if (result && typeof result === 'object') return { ok:!!result.ok, reason:result.reason, legacy:true };
      return { ok:result !== false, legacy:true };
    } catch (error) {
      enqueue('legacy-progress-sync', { message:error?.message || String(error) });
      return { ok:false, error:error?.message || String(error) };
    }
  }

  function recordActivity(event) {
    return enqueue('activity', {
      gradeLevel: event.gradeLevel || null,
      subjectKey: event.subjectKey || null,
      unitKey: event.unitKey || null,
      lessonKey: event.lessonKey || null,
      eventType: event.eventType || 'question',
      correct: typeof event.correct === 'boolean' ? event.correct : null,
      firstTry: typeof event.firstTry === 'boolean' ? event.firstTry : null,
      score: Number.isFinite(Number(event.score)) ? Number(event.score) : null,
      durationMs: Number.isFinite(Number(event.durationMs)) ? Number(event.durationMs) : null,
      metadata: event.metadata || {}
    });
  }

  function recordProgress(input) {
    return enqueue('progress', {
      gradeLevel: input.gradeLevel || null,
      subjectKey: input.subjectKey || null,
      unitKey: input.unitKey || null,
      mastery: Math.max(0, Math.min(100, Number(input.mastery) || 0)),
      stars: Math.max(0, Number(input.stars) || 0),
      attempts: Math.max(0, Number(input.attempts) || 0),
      correct: Math.max(0, Number(input.correct) || 0),
      firstTryCorrect: Math.max(0, Number(input.firstTryCorrect) || 0),
      metadata: input.metadata || {}
    });
  }

  function recordDailyGoal(input) {
    return enqueue('daily-goal', {
      goalDate: input.goalDate || new Date().toISOString().slice(0, 10),
      targetQuestions: Math.max(0, Number(input.targetQuestions) || 0),
      completedQuestions: Math.max(0, Number(input.completedQuestions) || 0),
      completed: !!input.completed,
      metadata: input.metadata || {}
    });
  }

  function setPlayerId(id) { try { localStorage.removeItem(PLAYER_ID_KEY); if (id) localStorage.setItem(PLAYER_ID_KEY, id); } catch (_) {} return id; }
  function playerId() { try { return localStorage.getItem(PLAYER_ID_KEY) || null; } catch (_) { return null; } }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
  }

  function uuidFromLegacyQueueId(value) {
    const raw = String(value || '').replace(/[^0-9a-f]/gi, '').padEnd(32, '0').slice(0, 32);
    return raw.slice(0,8)+'-'+raw.slice(8,12)+'-4'+raw.slice(13,16)+'-8'+raw.slice(17,20)+'-'+raw.slice(20,32);
  }

  function isCloudLinked() {
    return !!(window.KCCloud && typeof window.KCCloud.hasToken === 'function' && window.KCCloud.hasToken());
  }

  function isAfterSince(createdAt, sinceMs, sinceIso) {
    if (typeof createdAt === 'number') {
      return createdAt >= sinceMs;
    }
    if (typeof createdAt === 'string') {
      const parsed = Date.parse(createdAt);
      if (!isNaN(parsed)) return parsed >= sinceMs;
      return createdAt >= sinceIso;
    }
    return false;
  }

  async function flushNormalized() {
    if (!isCloudLinked()) return { ok: false, skipped: true, reason: 'normalized auth not linked' };
    const queue = loadQueue();
    const accountKey = String(currentAccount()?.name || '').trim().toLowerCase();
    // Normalized events are account-scoped. Legacy queue entries without an
    // accountKey are intentionally not attributed to the current account.
    const scopedQueue = queue.filter(x => x.accountKey === accountKey && accountKey);
    const activity = scopedQueue.filter(x => x.type === 'activity');
    const progressRows = scopedQueue.filter(x => x.type === 'progress');
    const goals = scopedQueue.filter(x => x.type === 'daily-goal');
    let sent = 0;

    if (activity.length) {
      const rows = activity.map(x => ({
        clientEventId: isUuid(x.id) ? x.id : uuidFromLegacyQueueId(x.id),
        gradeLevel: x.payload?.gradeLevel ?? null,
        subjectKey: x.payload?.subjectKey ?? null,
        unitKey: x.payload?.unitKey ?? null,
        eventType: x.payload?.eventType || 'question',
        correct: typeof x.payload?.correct === 'boolean' ? x.payload.correct : null,
        firstTry: typeof x.payload?.firstTry === 'boolean' ? x.payload.firstTry : null,
        score: Number.isFinite(Number(x.payload?.score)) ? Number(x.payload.score) : null,
        durationMs: Number.isFinite(Number(x.payload?.durationMs)) ? Number(x.payload.durationMs) : null,
        metadata: x.payload?.metadata || {}
      }));
      let res;
      try {
        res = await window.KCCloud.sendEvents(rows);
      } catch (err) {
        return { ok: false, error: err?.message || 'network_error', sent };
      }
      if (!res || !res.ok) {
        return { ok: false, error: res?.error || 'server_error', sent };
      }
      const sentIds = new Set(activity.map(x => x.id));
      saveQueue(loadQueue().filter(x => !sentIds.has(x.id)));
      sent += activity.length;
    }

    if (progressRows.length) {
      const rows = progressRows.map(x => ({
        gradeLevel: x.payload?.gradeLevel ?? null,
        subjectKey: x.payload?.subjectKey ?? null,
        unitKey: x.payload?.unitKey ?? null,
        mastery: Number.isFinite(Number(x.payload?.mastery)) ? Number(x.payload.mastery) : 0,
        stars: Number.isFinite(Number(x.payload?.stars)) ? Number(x.payload.stars) : 0,
        attempts: Number.isFinite(Number(x.payload?.attempts)) ? Number(x.payload.attempts) : 0,
        correct: Number.isFinite(Number(x.payload?.correct)) ? Number(x.payload.correct) : 0,
        firstTryCorrect: Number.isFinite(Number(x.payload?.firstTryCorrect)) ? Number(x.payload.firstTryCorrect) : 0,
        metadata: x.payload?.metadata || {}
      }));
      let res;
      try {
        res = await window.KCCloud.sendRows(rows);
      } catch (err) {
        return { ok: false, error: err?.message || 'network_error', sent };
      }
      if (!res || !res.ok) {
        return { ok: false, error: res?.error || 'server_error', sent };
      }
      const sentIds = new Set(progressRows.map(x => x.id));
      saveQueue(loadQueue().filter(x => !sentIds.has(x.id)));
      sent += progressRows.length;
    }

    if (goals.length) {
      const rows = goals.map(x => ({
        goalDate: x.payload?.goalDate || new Date().toISOString().slice(0, 10),
        targetQuestions: Number.isFinite(Number(x.payload?.targetQuestions)) ? Number(x.payload.targetQuestions) : 0,
        completedQuestions: Number.isFinite(Number(x.payload?.completedQuestions)) ? Number(x.payload.completedQuestions) : 0,
        completed: !!x.payload?.completed,
        metadata: x.payload?.metadata || {}
      }));
      let res;
      try {
        res = await window.KCCloud.sendGoals(rows);
      } catch (err) {
        return { ok: false, error: err?.message || 'network_error', sent };
      }
      if (!res || !res.ok) {
        return { ok: false, error: res?.error || 'server_error', sent };
      }
      const sentIds = new Set(goals.map(x => x.id));
      saveQueue(loadQueue().filter(x => !sentIds.has(x.id)));
      sent += goals.length;
    }

    return { ok: true, sent, remaining: loadQueue().length };
  }

  async function fetchNormalizedProgress() {
    if (!isCloudLinked()) return { ok: false, rows: [], reason: 'normalized auth not linked', error: 'normalized auth not linked' };
    try {
      const res = await window.KCCloud.report(30);
      if (!res || !res.ok) {
        return { ok: false, rows: [], error: res?.error || 'server_error' };
      }
      return { ok: true, rows: res.progress || [] };
    } catch (err) {
      return { ok: false, rows: [], error: err?.message || 'server_error' };
    }
  }

  async function fetchRecentActivity(days) {
    if (!isCloudLinked()) return { ok: false, rows: [], reason: 'normalized auth not linked', error: 'normalized auth not linked' };
    const d = Math.max(1, Number(days) || 7);
    const sinceMs = Date.now() - d * 86400000;
    const sinceIso = new Date(sinceMs).toISOString();
    try {
      const res = await window.KCCloud.report(d);
      if (!res || !res.ok) {
        return { ok: false, rows: [], error: res?.error || 'server_error' };
      }
      const rows = (res.events || []).filter(row => isAfterSince(row.created_at, sinceMs, sinceIso));
      return { ok: true, rows };
    } catch (err) {
      return { ok: false, rows: [], error: err?.message || 'server_error' };
    }
  }

  async function fetchSkillActivity(days) {
    if (!isCloudLinked()) return { ok: false, rows: [], reason: 'normalized auth not linked', error: 'normalized auth not linked' };
    const d = Math.max(1, Number(days) || 30);
    const sinceMs = Date.now() - d * 86400000;
    const sinceIso = new Date(sinceMs).toISOString();
    try {
      const res = await window.KCCloud.report(d);
      if (!res || !res.ok) {
        return { ok: false, rows: [], error: res?.error || 'server_error' };
      }
      const rows = [];
      for (const row of (res.events || [])) {
        if (!isAfterSince(row.created_at, sinceMs, sinceIso)) continue;
        const meta = typeof row.metadata === 'string' ? safeJson(row.metadata, null) : row.metadata;
        if (meta && typeof meta === 'object' && meta.skillId != null && meta.skillId !== '') {
          rows.push(typeof row.metadata === 'string' ? Object.assign({}, row, { metadata: meta }) : row);
        }
      }
      return { ok: true, rows };
    } catch (err) {
      return { ok: false, rows: [], error: err?.message || 'server_error' };
    }
  }

  function status() {
    const account = currentAccount();
    return {
      version: VERSION,
      online: navigator.onLine !== false,
      hasCloud: isCloudLinked(),
      hasSupabase: false,
      account: account ? { name: account.name || null } : null,
      queuedEvents: loadQueue().length,
      snapshot: !!readSnapshot()
    };
  }

  async function flush(progress) {
    localSnapshot(progress);
    if (!navigator.onLine) return { ok:false, offline:true, queued:loadQueue().length };
    const result = await syncLegacyProgress(progress);
    return { ...result, queued:loadQueue().length };
  }

  window.KCData = {
    VERSION,
    currentAccount,
    localSnapshot,
    readSnapshot,
    enqueue,
    recordActivity,
    recordProgress,
    recordDailyGoal,
    flush,
    flushNormalized,
    fetchNormalizedProgress,
    fetchRecentActivity,
    fetchSkillActivity,
    setPlayerId,
    playerId,
    status,
    _loadQueue: loadQueue
  };

  window.addEventListener('online', () => {
    window.dispatchEvent(new CustomEvent('kcdata:online'));
  });
})();
