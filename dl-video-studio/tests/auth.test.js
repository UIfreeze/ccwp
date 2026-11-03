import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, client } from './helpers.js';
import { hashPassword, verifyPassword } from '../server/auth.js';

let app;
before(async () => { app = await startTestApp(); });
after(() => app.close());

test('passwords are hashed with a per-user salt and verify correctly', () => {
  const a = hashPassword('s3cret-password');
  const b = hashPassword('s3cret-password');
  assert.notEqual(a, b);
  assert.ok(!a.includes('s3cret-password'));
  assert.ok(verifyPassword('s3cret-password', a));
  assert.ok(!verifyPassword('wrong', a));
});

test('no plaintext passwords are stored', () => {
  for (const row of app.db.prepare('SELECT password_hash FROM users').all()) assert.match(row.password_hash, /^scrypt\$/);
});

test('API rejects unauthenticated requests', async () => {
  const c = client(app.base);
  assert.equal((await c.call('/api/projects')).status, 401);
  assert.equal((await c.call('/api/session')).status, 401);
  assert.equal((await c.call('/api/health')).status, 200);
});

test('wrong password is rejected with a generic message', async () => {
  const c = client(app.base);
  const bad = await c.login('alice@test.local', 'nope');
  const unknown = await c.login('nobody@test.local', 'nope');
  assert.equal(bad.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(bad.data.error, unknown.data.error);
});

test('login sets an HttpOnly SameSite=Strict cookie and logout ends the session', async () => {
  const c = client(app.base);
  const r = await c.login('alice@test.local');
  assert.equal(r.status, 200);
  const cookie = r.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.equal((await c.call('/api/session')).status, 200);
  assert.equal((await c.call('/api/logout', { method: 'POST' })).status, 200);
  assert.equal((await c.call('/api/projects')).status, 401);
});

test('mutating requests without the CSRF token are refused', async () => {
  const c = client(app.base);
  await c.login('alice@test.local');
  const r = await c.call('/api/projects', { method: 'POST', body: { name: 'X' }, noCsrf: true });
  assert.equal(r.status, 403);
});

test('non-JSON bodies are refused', async () => {
  const c = client(app.base);
  await c.login('alice@test.local');
  const r = await c.call('/api/projects', { method: 'POST', headers: { 'Content-Type': 'text/plain' } });
  assert.equal(r.status, 415);
});

test('security headers are present on pages and API', async () => {
  for (const path of ['/', '/api/health']) {
    const res = await fetch(app.base + path);
    assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  }
});

test('static file serving cannot escape the public folder', async () => {
  const res = await fetch(app.base + '/..%2f..%2fpackage.json');
  const text = await res.text();
  assert.ok(!text.includes('"dl-video-studio"'));
});
