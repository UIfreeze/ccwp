// Project service. Every read and write goes through access checks here, on the server.
import { randomUUID } from 'node:crypto';
import { audit, now } from './db.js';
import { HttpError } from './http.js';

const JSON_FIELDS = ['platforms', 'aspect_ratios'];
const EDIT_ROLES = ['owner', 'editor'];
const MANAGE_ROLES = ['owner'];

function rowToProject(row) {
  if (!row) return null;
  const p = { ...row };
  for (const f of JSON_FIELDS) p[f] = JSON.parse(p[f] || '[]');
  return p;
}

/** Returns the caller's effective role on a project, or null when they have no access. */
export function roleFor(db, user, projectId) {
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!project) return null;
  if (user.systemRole === 'admin') return 'admin';
  const m = db.prepare('SELECT role FROM memberships WHERE project_id = ? AND user_id = ?').get(projectId, user.id);
  return m ? m.role : null;
}

/** Throws 404 (not 403) when the user cannot see the project, so IDs cannot be probed. */
export function requireAccess(db, user, projectId, allowed = null) {
  const role = roleFor(db, user, projectId);
  if (!role) throw new HttpError(404, 'Project not found.');
  if (allowed && role !== 'admin' && !allowed.includes(role)) {
    throw new HttpError(403, 'Your role on this project does not allow that action.');
  }
  return role;
}

export function listProjects(db, user) {
  const base = `SELECT p.*, u.name AS owner_name,
      (SELECT COUNT(*) FROM memberships m2 WHERE m2.project_id = p.id) AS member_count,
      (SELECT MAX(created_at) FROM audit_events a WHERE a.project_id = p.id) AS last_activity
    FROM projects p JOIN users u ON u.id = p.owner_id`;
  const rows = user.systemRole === 'admin'
    ? db.prepare(`${base} ORDER BY p.updated_at DESC`).all()
    : db.prepare(`${base} JOIN memberships m ON m.project_id = p.id AND m.user_id = ? ORDER BY p.updated_at DESC`).all(user.id);
  return rows.map(rowToProject);
}

export function createProject(db, user, data) {
  const id = randomUUID();
  const t = now();
  const p = {
    description: '', objective: '', audience: '', core_message: '', cta: '', constraints: '',
    references_notes: '', approver: '', platforms: [], aspect_ratios: [], duration_seconds: null,
    due_date: null, status: 'brief', ...data,
  };
  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO projects (id, name, description, status, owner_id, objective, audience, core_message, cta,
         platforms, aspect_ratios, duration_seconds, constraints, references_notes, approver, due_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, p.name, p.description, p.status, user.id, p.objective, p.audience, p.core_message, p.cta,
      JSON.stringify(p.platforms), JSON.stringify(p.aspect_ratios), p.duration_seconds, p.constraints,
      p.references_notes, p.approver, p.due_date, t, t
    );
    db.prepare('INSERT INTO memberships (project_id, user_id, role, invited_by, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, user.id, 'owner', user.id, t);
    audit(db, { projectId: id, actorId: user.id, action: 'project.created', targetType: 'project', targetId: id, metadata: { name: p.name } });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return getProject(db, user, id);
}

export function getProject(db, user, id) {
  const role = requireAccess(db, user, id);
  const project = rowToProject(db.prepare(
    'SELECT p.*, u.name AS owner_name FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?'
  ).get(id));
  const members = db.prepare(
    `SELECT u.id, u.name, u.email, m.role, m.created_at FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.project_id = ? ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'editor' THEN 1 WHEN 'reviewer' THEN 2 ELSE 3 END, u.name`
  ).all(id);
  return { ...project, my_role: role, members, permissions: permissionsFor(role) };
}

export function permissionsFor(role) {
  const admin = role === 'admin';
  return {
    edit: admin || EDIT_ROLES.includes(role),
    manageMembers: admin || MANAGE_ROLES.includes(role),
    archive: admin || MANAGE_ROLES.includes(role),
  };
}

export function updateProject(db, user, id, changes) {
  const role = requireAccess(db, user, id, EDIT_ROLES);
  if (changes.status === 'archived' && !permissionsFor(role).archive) {
    throw new HttpError(403, 'Only the project owner or an admin can archive a project.');
  }
  const before = rowToProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(id));
  const fields = Object.keys(changes).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(changes[k]));
  if (!fields.length) return getProject(db, user, id);

  const sets = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => (JSON_FIELDS.includes(f) ? JSON.stringify(changes[f]) : changes[f]));
  db.prepare(`UPDATE projects SET ${sets}, updated_at = ? WHERE id = ?`).run(...values, now(), id);

  const meta = { fields };
  if (fields.includes('status')) meta.status = { from: before.status, to: changes.status };
  audit(db, {
    projectId: id, actorId: user.id,
    action: fields.includes('status') ? 'project.status_changed' : 'project.updated',
    targetType: 'project', targetId: id, metadata: meta,
  });
  return getProject(db, user, id);
}

export function listActivity(db, user, id, limit = 50) {
  requireAccess(db, user, id);
  return db.prepare(
    `SELECT a.id, a.action, a.target_type, a.target_id, a.metadata, a.created_at, u.name AS actor_name
       FROM audit_events a LEFT JOIN users u ON u.id = a.actor_id
      WHERE a.project_id = ? ORDER BY a.id DESC LIMIT ?`
  ).all(id, limit).map((r) => ({ ...r, metadata: JSON.parse(r.metadata) }));
}

export function addMember(db, user, id, { email, role }) {
  requireAccess(db, user, id, MANAGE_ROLES);
  const target = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email);
  // Accounts are created by an admin (see scripts/create-admin.js); there is no self-signup or email invite yet.
  if (!target) throw new HttpError(400, 'No DL Video Studio account uses that email yet. Ask an admin to create it first.', { fields: { email: 'No account with this email.' } });
  const existing = db.prepare('SELECT role FROM memberships WHERE project_id = ? AND user_id = ?').get(id, target.id);
  if (existing?.role === 'owner') throw new HttpError(400, 'The project owner’s role cannot be changed here.');
  db.prepare(
    `INSERT INTO memberships (project_id, user_id, role, invited_by, created_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (project_id, user_id) DO UPDATE SET role = excluded.role`
  ).run(id, target.id, role, user.id, now());
  audit(db, {
    projectId: id, actorId: user.id, action: existing ? 'member.role_changed' : 'member.added',
    targetType: 'user', targetId: target.id, metadata: { name: target.name, role, previous: existing?.role ?? null },
  });
  return getProject(db, user, id);
}

export function removeMember(db, user, id, memberId) {
  requireAccess(db, user, id, MANAGE_ROLES);
  const m = db.prepare(
    'SELECT m.role, u.name FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.project_id = ? AND m.user_id = ?'
  ).get(id, memberId);
  if (!m) throw new HttpError(404, 'That person is not a member of this project.');
  if (m.role === 'owner') throw new HttpError(400, 'The project owner cannot be removed.');
  db.prepare('DELETE FROM memberships WHERE project_id = ? AND user_id = ?').run(id, memberId);
  audit(db, { projectId: id, actorId: user.id, action: 'member.removed', targetType: 'user', targetId: memberId, metadata: { name: m.name, role: m.role } });
  return getProject(db, user, id);
}
