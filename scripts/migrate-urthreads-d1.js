#!/usr/bin/env node

import { getDatabaseName, resultsFor, runD1 } from "./d1-utils.js";

const databaseName = getDatabaseName();

const columnMigrations = [
  ["parent_id", "ALTER TABLE post_comments ADD COLUMN parent_id INTEGER"],
  ["author_website", "ALTER TABLE post_comments ADD COLUMN author_website TEXT"],
  ["likes_count", "ALTER TABLE post_comments ADD COLUMN likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0)"],
  ["hidden_at", "ALTER TABLE post_comments ADD COLUMN hidden_at TEXT"],
];

const schemaStatements = [
  `CREATE INDEX IF NOT EXISTS post_comments_parent_idx
    ON post_comments (parent_id)`,
  `CREATE TABLE IF NOT EXISTS comment_denied_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS engagement_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL CHECK (event_type IN ('page_like', 'comment_like', 'comment_create')),
    path TEXT NOT NULL,
    comment_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS engagement_events_type_created_idx
    ON engagement_events (event_type, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS engagement_events_path_created_idx
    ON engagement_events (path, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS admin_audit_logs (
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
  )`,
  `CREATE INDEX IF NOT EXISTS admin_audit_logs_created_idx
    ON admin_audit_logs (created_at DESC, id DESC)`,
  `CREATE INDEX IF NOT EXISTS admin_audit_logs_action_created_idx
    ON admin_audit_logs (action, created_at DESC)`,
];

const existingColumns = new Set(
  resultsFor(databaseName, "PRAGMA table_info(post_comments)").map((column) => column.name),
);

for (const [column, sql] of columnMigrations) {
  if (existingColumns.has(column)) {
    console.log(`Column already exists: post_comments.${column}`);
    continue;
  }

  runD1(databaseName, sql);
  console.log(`Added column: post_comments.${column}`);
}

for (const sql of schemaStatements) {
  runD1(databaseName, sql);
}

const counts = resultsFor(databaseName, `
  SELECT
    (SELECT COUNT(*) FROM post_likes) AS post_likes,
    (SELECT COUNT(*) FROM post_comments) AS post_comments
`);

console.log(`Applied urthreads schema additions to ${databaseName}.`);
console.log(JSON.stringify(counts[0] || {}, null, 2));
