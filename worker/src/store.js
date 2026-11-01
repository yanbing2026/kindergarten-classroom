/**
 * BlockQuest Classroom - D1 Database Store Implementation
 * Uses Cloudflare D1 prepared statements and batches.
 */

export function createStore(db) {
  if (!db || typeof db.prepare !== 'function') {
    throw new TypeError('Valid D1 database instance required');
  }

  return {
    async findByName(nameKey) {
      const row = await db.prepare('SELECT * FROM players WHERE name_key = ?').bind(nameKey).first();
      return row || null;
    },

    async getById(id) {
      const row = await db.prepare('SELECT * FROM players WHERE id = ?').bind(id).first();
      return row || null;
    },

    async insertPlayer({ name, nameKey, pinVerifier, pinSalt, progress = '{}', now }) {
      const result = await db.prepare(
        'INSERT INTO players (name, name_key, pin_verifier, pin_salt, progress, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(name, nameKey, pinVerifier, pinSalt, progress, now, now).run();

      const id = result?.meta?.last_row_id;
      return {
        id,
        name,
        name_key: nameKey,
        pin_verifier: pinVerifier,
        pin_salt: pinSalt,
        progress,
        created_at: now,
        updated_at: now
      };
    },

    async updateProgress(id, json, now) {
      await db.prepare('UPDATE players SET progress = ?, updated_at = ? WHERE id = ?').bind(json, now, id).run();
    },

    async updatePin(id, verifier, salt, now) {
      await db.prepare('UPDATE players SET pin_verifier = ?, pin_salt = ?, updated_at = ? WHERE id = ?').bind(verifier, salt, now, id).run();
    },

    async deletePlayer(id) {
      await db.batch([
        db.prepare('DELETE FROM player_progress WHERE player_id = ?').bind(id),
        db.prepare('DELETE FROM activity_events WHERE player_id = ?').bind(id),
        db.prepare('DELETE FROM daily_goals WHERE player_id = ?').bind(id),
        db.prepare('DELETE FROM players WHERE id = ?').bind(id)
      ]);
    },

    async upsertProgressRows(playerId, rows, now) {
      if (!rows || rows.length === 0) return;
      const stmts = rows.map(r => {
        const metadataStr = typeof r.metadata === 'object' && r.metadata !== null
          ? JSON.stringify(r.metadata)
          : (r.metadata || null);
        return db.prepare(`
          INSERT INTO player_progress (
            player_id, grade_level, subject_key, unit_key,
            mastery, stars, attempts, correct, first_try_correct,
            metadata, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(player_id, grade_level, subject_key, unit_key) DO UPDATE SET
            mastery = excluded.mastery,
            stars = excluded.stars,
            attempts = excluded.attempts,
            correct = excluded.correct,
            first_try_correct = excluded.first_try_correct,
            metadata = excluded.metadata,
            updated_at = excluded.updated_at
        `).bind(
          playerId,
          r.grade_level || r.gradeLevel || null,
          r.subject_key || r.subjectKey || null,
          r.unit_key || r.unitKey || null,
          r.mastery !== undefined ? r.mastery : null,
          r.stars !== undefined ? r.stars : 0,
          r.attempts !== undefined ? r.attempts : 0,
          r.correct !== undefined ? r.correct : 0,
          r.first_try_correct !== undefined ? (r.first_try_correct || r.firstTryCorrect || 0) : 0,
          metadataStr,
          now
        );
      });
      await db.batch(stmts);
    },

    async upsertGoals(playerId, goals, now) {
      if (!goals || goals.length === 0) return 0;
      const stmts = goals.map(g => {
        const metadataStr = typeof g.metadata === 'object' && g.metadata !== null
          ? JSON.stringify(g.metadata)
          : (g.metadata || null);
        const goalDate = g.goal_date || g.goalDate;
        const target = g.target_questions !== undefined
          ? (g.target_questions !== null ? Number(g.target_questions) : null)
          : (g.targetQuestions !== undefined && g.targetQuestions !== null ? Number(g.targetQuestions) : null);
        const completedCount = g.completed_questions !== undefined
          ? (g.completed_questions !== null ? Number(g.completed_questions) : null)
          : (g.completedQuestions !== undefined && g.completedQuestions !== null ? Number(g.completedQuestions) : null);
        const completed = g.completed !== undefined ? (g.completed ? 1 : 0) : 0;

        return db.prepare(`
          INSERT INTO daily_goals (
            player_id, goal_date, target_questions, completed_questions, completed, metadata
          ) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(player_id, goal_date) DO UPDATE SET
            target_questions = excluded.target_questions,
            completed_questions = excluded.completed_questions,
            completed = excluded.completed,
            metadata = excluded.metadata
        `).bind(
          playerId,
          goalDate,
          target,
          completedCount,
          completed,
          metadataStr
        );
      });
      await db.batch(stmts);
      return goals.length;
    },

    async insertEvents(playerId, events, now) {
      if (!events || events.length === 0) return 0;
      const stmts = events.map(e => {
        const metadataStr = typeof e.metadata === 'object' && e.metadata !== null
          ? JSON.stringify(e.metadata)
          : (e.metadata || null);
        const createdAt = e.createdAt || e.created_at || now;
        return db.prepare(`
          INSERT OR IGNORE INTO activity_events (
            player_id, client_event_id, grade_level, subject_key, unit_key,
            event_type, correct, first_try, score, duration_ms, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          playerId,
          e.clientEventId || e.client_event_id,
          e.gradeLevel || e.grade_level || null,
          e.subjectKey || e.subject_key || null,
          e.unitKey || e.unit_key || null,
          e.eventType || e.event_type || null,
          e.correct ? 1 : 0,
          e.firstTry !== undefined ? (e.firstTry ? 1 : 0) : (e.first_try ? 1 : 0),
          e.score !== undefined ? Number(e.score) : 0,
          e.durationMs || e.duration_ms || 0,
          metadataStr,
          createdAt
        );
      });
      await db.batch(stmts);
      return events.length;
    },

    async listEvents(playerId, sinceTs) {
      const result = await db.prepare(
        'SELECT * FROM activity_events WHERE player_id = ? AND created_at >= ? ORDER BY created_at ASC'
      ).bind(playerId, sinceTs).all();
      return result?.results || [];
    },

    async listProgress(playerId) {
      const result = await db.prepare(
        'SELECT * FROM player_progress WHERE player_id = ? ORDER BY grade_level, subject_key, unit_key'
      ).bind(playerId).all();
      return result?.results || [];
    },

    async listGoals(playerId) {
      const result = await db.prepare(
        'SELECT * FROM daily_goals WHERE player_id = ? ORDER BY goal_date ASC'
      ).bind(playerId).all();
      return result?.results || [];
    },

    async recordAttempt(nameKey, now) {
      await db.prepare('INSERT INTO login_attempts (name_key, ts) VALUES (?, ?)').bind(nameKey, now).run();
    },

    async recentAttempts(nameKey, sinceTs) {
      const row = await db.prepare('SELECT COUNT(*) AS count FROM login_attempts WHERE name_key = ? AND ts >= ?').bind(nameKey, sinceTs).first();
      return row ? Number(row.count) : 0;
    },

    async clearAttempts(nameKey) {
      await db.prepare('DELETE FROM login_attempts WHERE name_key = ?').bind(nameKey).run();
    }
  };
}
