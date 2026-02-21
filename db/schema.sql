-- NeuroFlex D1 Database Schema

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_sync_at TEXT
);

CREATE TABLE IF NOT EXISTS profiles (
  device_id TEXT PRIMARY KEY REFERENCES devices(id),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id),
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  max_combo INTEGER NOT NULL,
  hints_used INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_device ON sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_game_type ON sessions(game_type);
