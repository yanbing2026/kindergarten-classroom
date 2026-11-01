-- BlockQuest Classroom - Cloudflare D1 SQLite Schema
-- Strictly conforms to docs/cloud-backend-d1.md

CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_key TEXT NOT NULL UNIQUE,
    pin_verifier TEXT NOT NULL,
    pin_salt TEXT NOT NULL,
    progress TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS player_progress (
    player_id INTEGER NOT NULL,
    grade_level TEXT,
    subject_key TEXT,
    unit_key TEXT,
    mastery INTEGER,
    stars INTEGER,
    attempts INTEGER,
    correct INTEGER,
    first_try_correct INTEGER,
    metadata TEXT,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (player_id, grade_level, subject_key, unit_key)
);

CREATE TABLE IF NOT EXISTS activity_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    client_event_id TEXT NOT NULL,
    grade_level TEXT,
    subject_key TEXT,
    unit_key TEXT,
    event_type TEXT,
    correct INTEGER,
    first_try INTEGER,
    score REAL,
    duration_ms INTEGER,
    metadata TEXT,
    created_at INTEGER NOT NULL,
    UNIQUE (player_id, client_event_id)
);

CREATE TABLE IF NOT EXISTS daily_goals (
    player_id INTEGER NOT NULL,
    goal_date TEXT NOT NULL,
    target_questions INTEGER,
    completed_questions INTEGER,
    completed INTEGER,
    metadata TEXT,
    PRIMARY KEY (player_id, goal_date)
);

CREATE TABLE IF NOT EXISTS login_attempts (
    name_key TEXT NOT NULL,
    ts INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_events_player_created ON activity_events(player_id, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_name_ts ON login_attempts(name_key, ts);
