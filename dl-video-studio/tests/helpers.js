import { createServer } from 'node:http';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/app.js';
import { createUser } from '../server/auth.js';

export const PASSWORD = 'correct-horse-battery';

/** Starts an isolated app on a random port with an in-memory database. */
export async function startTestApp() {
  const db = openDatabase(':memory:');
  const users = {};
  for (const [key, systemRole] of [['admin', 'admin'], ['alice', 'member'], ['bob', 'member'], ['carol', 'member']]) {
    users[key] = { email: `${key}@test.local`, id: createUser(db, { email: `${key}@test.local`, name: key, password: PASSWORD, systemRole }) };
  }
  const server = createServer(createApp({ db }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { db, users, base, close: () => new Promise((r) => server.close(r)) };
}

/** A tiny cookie-carrying client for one user. */
export function client(base) {
  let cookie = '';
  let csrf = '';
  const call = async (path, { method = 'GET', body, headers = {}, noCsrf = false } = {}) => {
    const h = { ...headers };
    if (cookie) h.Cookie = cookie;
    if (body !== undefined) h['Content-Type'] = 'application/json';
    if (method !== 'GET' && csrf && !noCsrf) h['X-CSRF-Token'] = csrf;
    const res = await fetch(base + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, data, headers: res.headers };
  };
  return {
    call,
    async login(email, password = PASSWORD) {
      const r = await call('/api/login', { method: 'POST', body: { email, password } });
      if (r.status === 200) csrf = r.data.csrf;
      return r;
    },
  };
}
