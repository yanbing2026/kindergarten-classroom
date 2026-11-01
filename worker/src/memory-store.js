/**
 * BlockQuest Classroom - In-Memory Store Implementation
 * Implements the identical interface as store.js for testing.
 * Simulates SQLite UNIQUE constraints and cascades.
 */

export function createMemoryStore() {
  let playerIdCounter = 1;
  let eventIdCounter = 1;

  const players = new Map(); // id -> player
  const playerProgress = new Map(); // `${playerId}:${grade}:${subject}:${unit}` -> progress
  const activityEvents = new Map(); // id -> event
  const activityEventIndex = new Set(); // `${playerId}:${clientEventId}` for idempotency
  const dailyGoals = new Map(); // `${playerId}:${date}` -> goal
  const loginAttempts = []; // array of { name_key, ts }

  return {
    async findByName(nameKey) {
      for (const p of players.values()) {
        if (p.name_key === nameKey) {
          return { ...p };
        }
      }
      return null;
    },

    async getById(id) {
      const p = players.get(id);
      return p ? { ...p } : null;
    },

    async insertPlayer({ name, nameKey, pinVerifier, pinSalt, progress = '{}', now }) {
      for (const p of players.values()) {
        if (p.name_key === nameKey) {
          const err = new Error('UNIQUE constraint failed: players.name_key');
          err.code = 'SQLITE_CONSTRAINT';
          throw err;
        }
      }

      const id = playerIdCounter++;
      const player = {
        id,
        name,
        name_key: nameKey,
        pin_verifier: pinVerifier,
        pin_salt: pinSalt,
        progress,
        created_at: now,
        updated_at: now
      };
      players.set(id, player);
      return { ...player };
    },

    async updateProgress(id, json, now) {
      const p = players.get(id);
      if (p) {
        p.progress = json;
        p.updated_at = now;
      }
    },

    async updatePin(id, verifier, salt, now) {
      const p = players.get(id);
      if (p) {
        p.pin_verifier = verifier;
        p.pin_salt = salt;
        p.updated_at = now;
      }
    },

    async deletePlayer(id) {
      players.delete(id);
      for (const [k, v] of playerProgress.entries()) {
        if (v.player_id === id) {
          playerProgress.delete(k);
        }
      }
      for (const [k, v] of activityEvents.entries()) {
        if (v.player_id === id) {
          activityEventIndex.delete(`${id}:${v.client_event_id}`);
          activityEvents.delete(k);
        }
      }
      for (const [k, v] of dailyGoals.entries()) {
        if (v.player_id === id) {
          dailyGoals.delete(k);
        }
      }
    },

    async upsertProgressRows(playerId, rows, now) {
      if (!rows || rows.length === 0) return;
      for (const r of rows) {
        const grade = r.grade_level || r.gradeLevel || null;
        const subj = r.subject_key || r.subjectKey || null;
        const unit = r.unit_key || r.unitKey || null;
        const key = `${playerId}:${grade}:${subj}:${unit}`;
        const metadataStr = typeof r.metadata === 'object' && r.metadata !== null
          ? JSON.stringify(r.metadata)
          : (r.metadata || null);

        playerProgress.set(key, {
          player_id: playerId,
          grade_level: grade,
          subject_key: subj,
          unit_key: unit,
          mastery: r.mastery !== undefined ? r.mastery : null,
          stars: r.stars !== undefined ? r.stars : 0,
          attempts: r.attempts !== undefined ? r.attempts : 0,
          correct: r.correct !== undefined ? r.correct : 0,
          first_try_correct: r.first_try_correct !== undefined
            ? (r.first_try_correct || r.firstTryCorrect || 0)
            : 0,
          metadata: metadataStr,
          updated_at: now
        });
      }
    },

    async insertEvents(playerId, events, now) {
      if (!events || events.length === 0) return 0;
      for (const e of events) {
        const clientEventId = e.clientEventId || e.client_event_id;
        const uniqueKey = `${playerId}:${clientEventId}`;
        if (activityEventIndex.has(uniqueKey)) {
          // Idempotent: ignore duplicate
          continue;
        }
        activityEventIndex.add(uniqueKey);

        const id = eventIdCounter++;
        const metadataStr = typeof e.metadata === 'object' && e.metadata !== null
          ? JSON.stringify(e.metadata)
          : (e.metadata || null);
        const createdAt = e.createdAt || e.created_at || now;

        activityEvents.set(id, {
          id,
          player_id: playerId,
          client_event_id: clientEventId,
          grade_level: e.gradeLevel || e.grade_level || null,
          subject_key: e.subjectKey || e.subject_key || null,
          unit_key: e.unitKey || e.unit_key || null,
          event_type: e.eventType || e.event_type || null,
          correct: e.correct ? 1 : 0,
          first_try: e.firstTry !== undefined
            ? (e.firstTry ? 1 : 0)
            : (e.first_try ? 1 : 0),
          score: e.score !== undefined ? Number(e.score) : 0,
          duration_ms: e.durationMs || e.duration_ms || 0,
          metadata: metadataStr,
          created_at: createdAt
        });
      }
      return events.length;
    },

    async listEvents(playerId, sinceTs) {
      const list = [];
      for (const e of activityEvents.values()) {
        if (e.player_id === playerId && e.created_at >= sinceTs) {
          list.push({ ...e });
        }
      }
      list.sort((a, b) => a.created_at - b.created_at);
      return list;
    },

    async listProgress(playerId) {
      const list = [];
      for (const p of playerProgress.values()) {
        if (p.player_id === playerId) {
          list.push({ ...p });
        }
      }
      return list;
    },

    async recordAttempt(nameKey, now) {
      loginAttempts.push({ name_key: nameKey, ts: now });
    },

    async recentAttempts(nameKey, sinceTs) {
      let count = 0;
      for (const a of loginAttempts) {
        if (a.name_key === nameKey && a.ts >= sinceTs) {
          count++;
        }
      }
      return count;
    },

    async clearAttempts(nameKey) {
      let i = loginAttempts.length;
      while (i--) {
        if (loginAttempts[i].name_key === nameKey) {
          loginAttempts.splice(i, 1);
        }
      }
    }
  };
}
