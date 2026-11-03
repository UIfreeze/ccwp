// SQLite persistence using Node's built-in node:sqlite module (no third-party driver).
// Migrations are ordered and tracked with PRAGMA user_version.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const MIGRATIONS = [
  // 1 — Milestone 1 foundation: users, sessions, projects, memberships, audit trail.
  `
  CREATE TABLE users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    system_role   TEXT NOT NULL DEFAULT 'member' CHECK (system_role IN ('admin','member')),
    created_at    TEXT NOT NULL
  );

  CREATE TABLE sessions (
    token_hash  TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf_token  TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL
  );
  CREATE INDEX sessions_user ON sessions(user_id);

  CREATE TABLE projects (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'brief',
    owner_id         TEXT NOT NULL REFERENCES users(id),
    objective        TEXT NOT NULL DEFAULT '',
    audience         TEXT NOT NULL DEFAULT '',
    core_message     TEXT NOT NULL DEFAULT '',
    cta              TEXT NOT NULL DEFAULT '',
    platforms        TEXT NOT NULL DEFAULT '[]',
    aspect_ratios    TEXT NOT NULL DEFAULT '[]',
    duration_seconds INTEGER,
    constraints      TEXT NOT NULL DEFAULT '',
    references_notes TEXT NOT NULL DEFAULT '',
    approver         TEXT NOT NULL DEFAULT '',
    due_date         TEXT,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL
  );

  CREATE TABLE memberships (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('owner','editor','reviewer','viewer')),
    invited_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL,
    PRIMARY KEY (project_id, user_id)
  );
  CREATE INDEX memberships_user ON memberships(user_id);

  CREATE TABLE audit_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  TEXT,
    actor_id    TEXT,
    action      TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id   TEXT,
    metadata    TEXT NOT NULL DEFAULT '{}',
    created_at  TEXT NOT NULL
  );
  CREATE INDEX audit_project ON audit_events(project_id, id);
  `,
  // 2 — Milestone 2 production workspace. One table, typed by `kind`, validated against server/workspace-schema.js.
  `
  CREATE TABLE workspace_items (
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL,
    position   INTEGER NOT NULL,
    data       TEXT NOT NULL DEFAULT '{}',
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX workspace_project_kind ON workspace_items(project_id, kind, position);
  `,
];

export function openDatabase(file = ':memory:') {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  migrate(db);
  return db;
}

function migrate(db) {
  const current = db.prepare('PRAGMA user_version').get().user_version;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[v]);
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}

export const now = () => new Date().toISOString();

export function audit(db, { projectId = null, actorId = null, action, targetType, targetId = null, metadata = {} }) {
  db.prepare(
    `INSERT INTO audit_events (project_id, actor_id, action, target_type, target_id, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(projectId, actorId, action, targetType, targetId, JSON.stringify(metadata), now());
}
