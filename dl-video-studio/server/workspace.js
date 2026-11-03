// Production workspace service: concepts, scenes, shots, prompts, assets and checklist items.
// Reads need project membership; writes need owner/editor (or admin). All checks happen here.
import { randomUUID } from 'node:crypto';
import { audit, now } from './db.js';
import { HttpError } from './http.js';
import { requireAccess } from './projects.js';
import { WORKSPACE, KINDS, DEFAULT_CHECKLIST } from './workspace-schema.js';

const EDIT_ROLES = ['owner', 'editor'];

function schemaFor(kind) {
  const s = WORKSPACE[kind];
  if (!s) throw new HttpError(404, 'Unknown workspace section.');
  return s;
}

const toItem = (r) => ({ id: r.id, kind: r.kind, position: r.position, data: JSON.parse(r.data), created_at: r.created_at, updated_at: r.updated_at, updated_by_name: r.updated_by_name ?? null });
const titleOf = (kind, data) => data[WORKSPACE[kind].titleField] ?? '';

function validate(db, projectId, kind, input, { partial }) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Expected a JSON object.');
  const schema = schemaFor(kind);
  const known = new Set(schema.fields.map((f) => f.key));
  const unknown = Object.keys(input).filter((k) => !known.has(k));
  if (unknown.length) throw new HttpError(400, `Unknown field(s): ${unknown.join(', ')}.`);

  const out = {};
  const errors = {};
  for (const f of schema.fields) {
    if (!(f.key in input)) {
      if (!partial && f.default !== undefined) out[f.key] = f.default;
      if (!partial && f.required) errors[f.key] = `${f.label} is required.`;
      continue;
    }
    const v = input[f.key];
    const empty = v === null || v === '';
    if (f.required && (empty || (typeof v === 'string' && !v.trim()))) { errors[f.key] = `${f.label} is required.`; continue; }
    switch (f.type) {
      case 'text':
      case 'longtext':
        if (empty) { out[f.key] = ''; break; }
        if (typeof v !== 'string') errors[f.key] = 'Must be text.';
        else if (v.trim().length > f.max) errors[f.key] = `Must be ${f.max} characters or fewer.`;
        else out[f.key] = f.type === 'text' ? v.trim() : v.replace(/\s+$/, '');
        break;
      case 'enum':
        if (empty) { out[f.key] = null; break; }
        if (!f.options.includes(v)) errors[f.key] = 'Unsupported value.';
        else out[f.key] = v;
        break;
      case 'int':
        if (empty) { out[f.key] = null; break; }
        if (!Number.isInteger(v) || v < f.min || v > f.max) errors[f.key] = `Whole number from ${f.min} to ${f.max}.`;
        else out[f.key] = v;
        break;
      case 'bool':
        if (typeof v !== 'boolean') errors[f.key] = 'Must be true or false.';
        else out[f.key] = v;
        break;
      case 'ref': {
        if (empty) { out[f.key] = null; break; }
        const ok = typeof v === 'string' && db.prepare('SELECT 1 FROM workspace_items WHERE id = ? AND project_id = ? AND kind = ?').get(v, projectId, f.ref);
        if (!ok) errors[f.key] = `Choose an existing ${WORKSPACE[f.ref].singular.toLowerCase()} from this project.`;
        else out[f.key] = v;
        break;
      }
      default:
        throw new Error(`Unhandled field type ${f.type}`);
    }
  }
  if (Object.keys(errors).length) throw new HttpError(400, 'Please fix the highlighted fields.', { fields: errors });
  return out;
}

export function getWorkspace(db, user, projectId) {
  requireAccess(db, user, projectId);
  const rows = db.prepare(
    `SELECT w.*, u.name AS updated_by_name FROM workspace_items w LEFT JOIN users u ON u.id = w.updated_by
      WHERE w.project_id = ? ORDER BY w.kind, w.position`
  ).all(projectId);
  const items = Object.fromEntries(KINDS.map((k) => [k, []]));
  for (const r of rows) items[r.kind].push(toItem(r));
  return items;
}

function getItem(db, projectId, kind, itemId) {
  const r = db.prepare('SELECT * FROM workspace_items WHERE id = ? AND project_id = ? AND kind = ?').get(itemId, projectId, kind);
  if (!r) throw new HttpError(404, `${WORKSPACE[kind].singular} not found.`);
  return toItem(r);
}

function insert(db, user, projectId, kind, data) {
  const id = randomUUID();
  const t = now();
  const pos = db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS p FROM workspace_items WHERE project_id = ? AND kind = ?').get(projectId, kind).p;
  db.prepare(
    `INSERT INTO workspace_items (id, project_id, kind, position, data, created_by, updated_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, projectId, kind, pos, JSON.stringify(data), user.id, user.id, t, t);
  return id;
}

const touchProject = (db, projectId) => db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now(), projectId);

export function createItem(db, user, projectId, kind, input) {
  requireAccess(db, user, projectId, EDIT_ROLES);
  schemaFor(kind);
  const data = validate(db, projectId, kind, input, { partial: false });
  const id = insert(db, user, projectId, kind, data);
  touchProject(db, projectId);
  audit(db, { projectId, actorId: user.id, action: 'workspace.created', targetType: kind, targetId: id, metadata: { kind, title: titleOf(kind, data) } });
  return getItem(db, projectId, kind, id);
}

export function updateItem(db, user, projectId, kind, itemId, input) {
  requireAccess(db, user, projectId, EDIT_ROLES);
  schemaFor(kind);
  const before = getItem(db, projectId, kind, itemId);
  const changes = validate(db, projectId, kind, input, { partial: true });
  const fields = Object.keys(changes).filter((k) => JSON.stringify(before.data[k] ?? null) !== JSON.stringify(changes[k] ?? null));
  if (!fields.length) return before;
  const data = { ...before.data, ...changes };
  db.prepare('UPDATE workspace_items SET data = ?, updated_by = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(data), user.id, now(), itemId);
  touchProject(db, projectId);
  const meta = { kind, title: titleOf(kind, data), fields };
  if (kind === 'checklist' && fields.includes('done')) meta.done = data.done;
  audit(db, { projectId, actorId: user.id, action: 'workspace.updated', targetType: kind, targetId: itemId, metadata: meta });
  return getItem(db, projectId, kind, itemId);
}

export function deleteItem(db, user, projectId, kind, itemId) {
  requireAccess(db, user, projectId, EDIT_ROLES);
  schemaFor(kind);
  const item = getItem(db, projectId, kind, itemId);
  // Refuse to delete something other items still point at, rather than silently breaking links.
  const dependents = [];
  for (const [k, s] of Object.entries(WORKSPACE)) {
    for (const f of s.fields.filter((x) => x.type === 'ref' && x.ref === kind)) {
      const n = db.prepare(`SELECT COUNT(*) AS n FROM workspace_items WHERE project_id = ? AND kind = ? AND json_extract(data, '$.' || ?) = ?`)
        .get(projectId, k, f.key, itemId).n;
      if (n) dependents.push(`${n} ${n === 1 ? s.singular.toLowerCase() : s.label.toLowerCase()}`);
    }
  }
  if (dependents.length) {
    throw new HttpError(409, `This ${WORKSPACE[kind].singular.toLowerCase()} is still linked from ${dependents.join(' and ')}. Unlink those first.`);
  }
  db.prepare('DELETE FROM workspace_items WHERE id = ?').run(itemId);
  touchProject(db, projectId);
  audit(db, { projectId, actorId: user.id, action: 'workspace.deleted', targetType: kind, targetId: itemId, metadata: { kind, title: titleOf(kind, item.data) } });
  return { ok: true };
}

export function moveItem(db, user, projectId, kind, itemId, direction) {
  requireAccess(db, user, projectId, EDIT_ROLES);
  schemaFor(kind);
  if (!['up', 'down'].includes(direction)) throw new HttpError(400, 'Direction must be up or down.');
  const item = getItem(db, projectId, kind, itemId);
  const neighbour = db.prepare(
    `SELECT id, position FROM workspace_items WHERE project_id = ? AND kind = ? AND position ${direction === 'up' ? '<' : '>'} ?
      ORDER BY position ${direction === 'up' ? 'DESC' : 'ASC'} LIMIT 1`
  ).get(projectId, kind, item.position);
  if (!neighbour) return getWorkspace(db, user, projectId)[kind];
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE workspace_items SET position = ? WHERE id = ?').run(neighbour.position, itemId);
    db.prepare('UPDATE workspace_items SET position = ? WHERE id = ?').run(item.position, neighbour.id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return getWorkspace(db, user, projectId)[kind];
}

export function addDefaultChecklist(db, user, projectId) {
  requireAccess(db, user, projectId, EDIT_ROLES);
  const existing = new Set(
    db.prepare("SELECT json_extract(data, '$.label') AS l FROM workspace_items WHERE project_id = ? AND kind = 'checklist'").all(projectId).map((r) => r.l)
  );
  let added = 0;
  db.exec('BEGIN');
  try {
    for (const [category, label] of DEFAULT_CHECKLIST) {
      if (existing.has(label)) continue;
      insert(db, user, projectId, 'checklist', { label, category, done: false });
      added += 1;
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  if (added) {
    touchProject(db, projectId);
    audit(db, { projectId, actorId: user.id, action: 'workspace.checklist_added', targetType: 'checklist', metadata: { added } });
  }
  return getWorkspace(db, user, projectId).checklist;
}
