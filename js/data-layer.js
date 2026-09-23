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
  const PLAYER_ID_KEY = 'kc_normalized_player_id_v1';

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
      const account = currentAccount();
      const result = account?.name ? await window.cloudSaveProgress(account.name, progress) : false;
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

  function setPlayerId(id) { try { if (id) localStorage.setItem(PLAYER_ID_KEY, id); } catch (_) {} return id; }
  function playerId() { try { return localStorage.getItem(PLAYER_ID_KEY) || null; } catch (_) { return null; } }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
  }

  function uuidFromLegacyQueueId(value) {
    const raw = String(value || '').replace(/[^0-9a-f]/gi, '').padEnd(32, '0').slice(0, 32);
    return raw.slice(0,8)+'-'+raw.slice(8,12)+'-4'+raw.slice(13,16)+'-8'+raw.slice(17,20)+'-'+raw.slice(20,32);
  }

  async function flushNormalized() {
    const id = playerId();
    if (!id || !window.supa) return { ok:false, skipped:true, reason:'normalized auth not linked' };
    const queue = loadQueue();
    const activity = queue.filter(x => x.type === 'activity');
    const progressRows = queue.filter(x => x.type === 'progress');
    const goals = queue.filter(x => x.type === 'daily-goal');
    let sent = 0;
    if (activity.length) {
      const rows = activity.map(x => ({
        player_id:id,
        client_event_id: isUuid(x.id) ? x.id : uuidFromLegacyQueueId(x.id),
        ...x.payload
      }));
      const { error } = await window.supa
        .from('activity_events')
        .upsert(rows, { onConflict:'player_id,client_event_id', ignoreDuplicates:true });
      if (error) return { ok:false, error:error.message, sent };
      sent += activity.length;
    }
    if (progressRows.length) {
      const rows = progressRows.map(x => ({ player_id:id, ...x.payload }));
      const { error } = await window.supa.from('player_progress').upsert(rows, { onConflict:'player_id,grade_level,subject_key,unit_key' });
      if (error) return { ok:false, error:error.message, sent };
      sent += progressRows.length;
    }
    if (goals.length) {
      const rows = goals.map(x => ({ player_id:id, goal_date:x.payload.goalDate, target_questions:x.payload.targetQuestions, completed_questions:x.payload.completedQuestions, completed:x.payload.completed, metadata:x.payload.metadata || {} }));
      const { error } = await window.supa.from('daily_goals').upsert(rows, { onConflict:'player_id,goal_date' });
      if (error) return { ok:false, error:error.message, sent };
      sent += goals.length;
    }
    if (sent) saveQueue(queue.filter(x => !['activity','progress','daily-goal'].includes(x.type)));
    return { ok:true, sent, remaining:loadQueue().length };
  }

  async function fetchNormalizedProgress() {
    const id = playerId();
    if (!id || !window.supa) return { ok:false, rows:[], reason:'normalized auth not linked' };
    const { data, error } = await window.supa
      .from('player_progress')
      .select('grade_level,subject_key,unit_key,mastery,stars,attempts,correct,first_try_correct,metadata,updated_at')
      .eq('player_id', id)
      .order('updated_at', { ascending:false });
    return error ? { ok:false, rows:[], error:error.message } : { ok:true, rows:data || [] };
  }

  async function fetchRecentActivity(days) {
    const id = playerId();
    if (!id || !window.supa) return { ok:false, rows:[], reason:'normalized auth not linked' };
    const since = new Date(Date.now() - Math.max(1, Number(days) || 7) * 86400000).toISOString();
    const { data, error } = await window.supa
      .from('activity_events')
      .select('client_event_id,grade_level,subject_key,unit_key,event_type,correct,first_try,score,duration_ms,metadata,created_at')
      .eq('player_id', id)
      .gte('created_at', since)
      .order('created_at', { ascending:false })
      .limit(500);
    return error ? { ok:false, rows:[], error:error.message } : { ok:true, rows:data || [] };
  }

  async function fetchSkillActivity(days) {
    const id = playerId();
    if (!id || !window.supa) return { ok:false, rows:[], reason:'normalized auth not linked' };
    const since = new Date(Date.now() - Math.max(1, Number(days) || 30) * 86400000).toISOString();
    const { data, error } = await window.supa
      .from('activity_events')
      .select('client_event_id,grade_level,subject_key,unit_key,event_type,correct,first_try,score,metadata,created_at')
      .eq('player_id', id)
      .gte('created_at', since)
      .not('metadata->>skillId','is',null)
      .order('created_at', { ascending:true })
      .limit(2000);
    return error ? { ok:false, rows:[], error:error.message } : { ok:true, rows:data || [] };
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
