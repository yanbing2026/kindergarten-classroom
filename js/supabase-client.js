/* Kindergarten Classroom — Supabase browser client
 * Safe fallback: this file does nothing until configured.
 * Never put a Supabase service-role/secret key here.
 */
(function (window) {
  'use strict';

  const CONFIG = {
    url: window.SUPABASE_URL || '',
    anonKey: window.SUPABASE_ANON_KEY || ''
  };

  let client = null;

  function isConfigured() {
    return Boolean(CONFIG.url && CONFIG.anonKey && window.supabase?.createClient);
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (!client) client = window.supabase.createClient(CONFIG.url, CONFIG.anonKey);
    return client;
  }

  async function getQuestions(options = {}) {
    const db = getClient();
    if (!db) return { data: null, error: new Error('Supabase is not configured') };

    let query = db
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (options.lessonId) query = query.eq('lesson_id', options.lessonId);
    if (options.questionType) query = query.eq('question_type', options.questionType);
    if (options.limit) query = query.limit(options.limit);

    return query;
  }

  async function saveAnswer(answer) {
    const db = getClient();
    if (!db) return { data: null, error: new Error('Supabase is not configured') };
    return db.from('student_answers').insert(answer).select().single();
  }

  async function getStudentProgress(studentId) {
    const db = getClient();
    if (!db) return { data: null, error: new Error('Supabase is not configured') };
    return db
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .order('last_activity_at', { ascending: false });
  }

  window.KCSupabase = {
    isConfigured,
    getClient,
    getQuestions,
    saveAnswer,
    getStudentProgress
  };
})(window);
