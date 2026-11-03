import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, client } from './helpers.js';

let app, alice, bob, carol, admin, projectId;

before(async () => {
  app = await startTestApp();
  [alice, bob, carol, admin] = [client(app.base), client(app.base), client(app.base), client(app.base)];
  await alice.login('alice@test.local');
  await bob.login('bob@test.local');
  await carol.login('carol@test.local');
  await admin.login('admin@test.local');
  const r = await alice.call('/api/projects', { method: 'POST', body: {
    name: 'Explainer', objective: 'Explain discovery', platforms: ['linkedin'], aspect_ratios: ['4:5', '9:16'], duration_seconds: 45,
  } });
  assert.equal(r.status, 201);
  projectId = r.data.project.id;
});
after(() => app.close());

test('creator becomes owner with full permissions', async () => {
  const { data } = await alice.call(`/api/projects/${projectId}`);
  assert.equal(data.project.my_role, 'owner');
  assert.deepEqual(data.project.permissions, { edit: true, manageMembers: true, archive: true });
  assert.deepEqual(data.project.aspect_ratios, ['4:5', '9:16']);
});

test('validation rejects bad input with field messages', async () => {
  const r = await alice.call('/api/projects', { method: 'POST', body: { name: '', platforms: ['myspace'], duration_seconds: -3, due_date: '31/12/2026' } });
  assert.equal(r.status, 400);
  assert.ok(r.data.fields.name && r.data.fields.platforms && r.data.fields.duration_seconds && r.data.fields.due_date);
});

test('non-members cannot see, guess or modify a project (404, not 403)', async () => {
  assert.equal((await bob.call('/api/projects')).data.projects.length, 0);
  assert.equal((await bob.call(`/api/projects/${projectId}`)).status, 404);
  assert.equal((await bob.call(`/api/projects/${projectId}/activity`)).status, 404);
  assert.equal((await bob.call(`/api/projects/${projectId}`, { method: 'PATCH', body: { name: 'Hijacked' } })).status, 404);
  assert.equal((await bob.call(`/api/projects/${projectId}/members`, { method: 'POST', body: { email: 'bob@test.local', role: 'editor' } })).status, 404);
  assert.equal((await alice.call(`/api/projects/${projectId}`)).data.project.name, 'Explainer');
});

test('a missing project and an inaccessible project look identical', async () => {
  const missing = await bob.call('/api/projects/00000000-0000-0000-0000-000000000000');
  const hidden = await bob.call(`/api/projects/${projectId}`);
  assert.equal(missing.status, hidden.status);
  assert.deepEqual(missing.data, hidden.data);
});

test('reviewers can read but not edit; editors can edit but not manage members or archive', async () => {
  assert.equal((await alice.call(`/api/projects/${projectId}/members`, { method: 'POST', body: { email: 'bob@test.local', role: 'reviewer' } })).status, 200);
  assert.equal((await alice.call(`/api/projects/${projectId}/members`, { method: 'POST', body: { email: 'carol@test.local', role: 'editor' } })).status, 200);

  const asBob = await bob.call(`/api/projects/${projectId}`);
  assert.equal(asBob.status, 200);
  assert.equal(asBob.data.project.permissions.edit, false);
  assert.equal((await bob.call(`/api/projects/${projectId}`, { method: 'PATCH', body: { cta: 'x' } })).status, 403);

  assert.equal((await carol.call(`/api/projects/${projectId}`, { method: 'PATCH', body: { cta: 'Book a call', status: 'script' } })).status, 200);
  assert.equal((await carol.call(`/api/projects/${projectId}`, { method: 'PATCH', body: { status: 'archived' } })).status, 403);
  assert.equal((await carol.call(`/api/projects/${projectId}/members`, { method: 'POST', body: { email: 'admin@test.local', role: 'viewer' } })).status, 403);
});

test('owner cannot be demoted or removed', async () => {
  const r = await alice.call(`/api/projects/${projectId}/members`, { method: 'POST', body: { email: 'alice@test.local', role: 'viewer' } });
  assert.equal(r.status, 400);
  const del = await alice.call(`/api/projects/${projectId}/members/${app.users.alice.id}`, { method: 'DELETE' });
  assert.equal(del.status, 400);
});

test('removing a member revokes access immediately', async () => {
  assert.equal((await alice.call(`/api/projects/${projectId}/members/${app.users.bob.id}`, { method: 'DELETE' })).status, 200);
  assert.equal((await bob.call(`/api/projects/${projectId}`)).status, 404);
});

test('admins see every project', async () => {
  const { data } = await admin.call('/api/projects');
  assert.ok(data.projects.some((p) => p.id === projectId));
  assert.equal((await admin.call(`/api/projects/${projectId}`)).data.project.my_role, 'admin');
});

test('audit trail records creation, edits, stage changes and membership changes in order', async () => {
  const { data } = await alice.call(`/api/projects/${projectId}/activity`);
  const actions = data.events.map((e) => e.action).reverse();
  assert.deepEqual(actions, [
    'project.created', 'member.added', 'member.added', 'project.status_changed', 'member.removed',
  ]);
  const stage = data.events.find((e) => e.action === 'project.status_changed');
  assert.deepEqual(stage.metadata.status, { from: 'brief', to: 'script' });
  assert.ok(stage.metadata.fields.includes('cta'));
});

test('a PATCH that changes nothing does not add an audit event', async () => {
  const before = (await alice.call(`/api/projects/${projectId}/activity`)).data.events.length;
  await alice.call(`/api/projects/${projectId}`, { method: 'PATCH', body: { name: 'Explainer' } });
  const after = (await alice.call(`/api/projects/${projectId}/activity`)).data.events.length;
  assert.equal(after, before);
});
