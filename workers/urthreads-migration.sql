-- Additive migration for moving this site's existing D1 data to urthreads.
-- Run against the existing D1 database after taking a backup.
-- Do not drop or recreate post_likes or post_comments; they contain live data.

ALTER TABLE post_comments ADD COLUMN parent_id INTEGER;
ALTER TABLE post_comments ADD COLUMN author_website TEXT;
ALTER TABLE post_comments ADD COLUMN likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0);
ALTER TABLE post_comments ADD COLUMN hidden_at TEXT;

CREATE INDEX IF NOT EXISTS post_comments_parent_idx
  ON post_comments (parent_id);

CREATE TABLE IF NOT EXISTS comment_denied_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS engagement_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_like', 'comment_like', 'comment_create')),
  path TEXT NOT NULL,
  comment_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS engagement_events_type_created_idx
  ON engagement_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS engagement_events_path_created_idx
  ON engagement_events (path, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status INTEGER NOT NULL,
  admin_key_fingerprint TEXT,
  client_ip TEXT,
  user_agent TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_idx
  ON admin_audit_logs (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS admin_audit_logs_action_created_idx
  ON admin_audit_logs (action, created_at DESC);
