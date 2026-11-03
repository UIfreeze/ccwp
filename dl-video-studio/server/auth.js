// Password hashing (scrypt), session tokens and CSRF tokens using only node:crypto.
import { randomBytes, scryptSync, timingSafeEqual, createHash, randomUUID } from 'node:crypto';
import { now } from './db.js';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const SESSION_DAYS = 7;
export const SESSION_COOKIE = 'dlvs_session';

export function hashPassword(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

export function createUser(db, { email, name, password, systemRole = 'member' }) {
  const id = randomUUID();
  db.prepare(
    'INSERT INTO users (id, email, name, password_hash, system_role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, email.trim().toLowerCase(), name.trim(), hashPassword(password), systemRole, now());
  return id;
}

export function createSession(db, userId) {
  const token = randomBytes(32).toString('base64url');
  const csrf = randomBytes(24).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  db.prepare('INSERT INTO sessions (token_hash, user_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(sha256(token), userId, csrf, now(), expires);
  return { token, csrf, maxAge: SESSION_DAYS * 86400 };
}

export function getSession(db, token) {
  if (!token) return null;
  const row = db.prepare(
    `SELECT s.token_hash, s.csrf_token, s.expires_at, u.id, u.email, u.name, u.system_role
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`
  ).get(sha256(token));
  if (!row) return null;
  if (row.expires_at < now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash);
    return null;
  }
  return {
    tokenHash: row.token_hash,
    csrf: row.csrf_token,
    user: { id: row.id, email: row.email, name: row.name, systemRole: row.system_role },
  };
}

export function destroySession(db, tokenHash) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Very small fixed-window limiter for login attempts (per key, in memory).
export function createRateLimiter({ limit = 10, windowMs = 15 * 60_000 } = {}) {
  const hits = new Map();
  return {
    check(key) {
      const t = Date.now();
      const entry = hits.get(key);
      if (!entry || t - entry.start > windowMs) {
        hits.set(key, { start: t, count: 1 });
        return true;
      }
      entry.count += 1;
      return entry.count <= limit;
    },
    reset(key) { hits.delete(key); },
  };
}
