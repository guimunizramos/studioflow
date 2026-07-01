-- StudioFlow schema (Neon / Postgres)
-- Mirrors services/storage DatabaseSchema (types.ts)

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  weekly_hours NUMERIC NOT NULL DEFAULT 0,
  min_daily_hours NUMERIC NOT NULL DEFAULT 0,
  priority TEXT NOT NULL,
  observations TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  type TEXT NOT NULL,
  start_date TEXT,
  estimated_deadline TEXT,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  client_id TEXT NOT NULL DEFAULT '',
  project_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  estimated_hours NUMERIC NOT NULL DEFAULT 1,
  deadline TEXT NOT NULL,
  start_time TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  reference_link TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS app_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_hours_per_day NUMERIC NOT NULL DEFAULT 8,
  work_window_start TEXT NOT NULL DEFAULT '09:00',
  work_window_end TEXT NOT NULL DEFAULT '18:00',
  notes TEXT NOT NULL DEFAULT '',
  unavailable_days JSONB NOT NULL DEFAULT '[]',
  visual JSONB NOT NULL DEFAULT '{"themeMode":"light","primaryColor":"#2563eb","density":"comfortable","sidebarColor":"#111827"}'
);

CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  snapshot JSONB NOT NULL
);

INSERT INTO app_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
