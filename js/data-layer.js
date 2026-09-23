(function () {
  'use strict';

  // BlockQuest Classroom data layer.
  // This is deliberately a compatibility-first layer: localStorage remains the
  // source of truth for the existing app while normalized Supabase tables are
  // adopted incrementally. It never stores a PIN.
  const VERSION = 1;
  const QUEUE_KEY = 'kc_data_queue_v1';
  const SNAPSHOT_KEY = 'kc_data_snapshot_v1';
  const ACCOUNT_KEY = 'kc_current_account';

  const safeJson = (value, fallback) => {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  };

  function currentAccount() {
    return safeJson(localStorage.getItem(ACCOUNT_KEY) || '', null);
  }

  function loadQueue() {
    return safeJson(localStorage.getItem(QUEUE_KEY) || '[]', []);
  }

  function saveQueue(queue) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-100))); } catch (_) {}
  }

  function enqueue(type, payload) {
    const queue = loadQueue();
    queue.push({
      id: (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random()),
      type,
      payload,
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
    // Normalized tables are not written here because the current name+PIN flow
    // does not establish a Supabase Auth session for RLS ownership.
    if (typeof window.cloudSaveProgress !== 'function') {
      return { ok:false, skipped:true, reason:'legacy cloud bridge unavailable' };
    }
    try {
      const result = await window.cloudSaveProgress(progress);
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

  function status() {
    const account = currentAccount();
    return {
      version: VERSION,
      online: navigator.onLine !== false,
      hasSupabase: !!window.supa,
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
    status,
    _loadQueue: loadQueue
  };

  window.addEventListener('online', () => {
    window.dispatchEvent(new CustomEvent('kcdata:online'));
  });
})();
