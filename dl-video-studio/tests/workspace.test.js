import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, client } from './helpers.js';
import { DEFAULT_CHECKLIST } from '../server/workspace-schema.js';

let app, owner, reviewer, outsider, pid, otherPid;
const ws = (p = pid) => `/api/projects/${p}/workspace`;

before(async () => {
  app = await startTestApp();
  [owner, reviewer, outsider] = [client(app.base), client(app.base), client(app.base)];
  await owner.login('alice@test.local');
  await reviewer.login('bob@test.local');
  await outsider.login('carol@test.local');
  pid = (await owner.call('/api/projects', { method: 'POST', body: { name: 'WS' } })).data.project.id;
  otherPid = (await owner.call('/api/projects', { method: 'POST', body: { name: 'Other' } })).data.project.id;
  await owner.call(`/api/projects/${pid}/members`, { method: 'POST', body: { email: 'bob@test.local', role: 'reviewer' } });
});
after(() => app.close());

test('schema is served and lists every section', async () => {
  const { data } = await owner.call('/api/workspace-schema');
  assert.deepEqual(Object.keys(data.schema), ['concept', 'scene', 'shot', 'prompt', 'asset', 'checklist']);
});

test('create applies defaults and validation', async () => {
  const r = await owner.call(`${ws()}/concept`, { method: 'POST', body: { title: 'Idea to plan', hook: 'Every founder starts with an idea' } });
  assert.equal(r.status, 201);
  assert.equal(r.data.item.data.status, 'draft');

  const bad = await owner.call(`${ws()}/shot`, { method: 'POST', body: { title: '', method: 'telepathy', duration_seconds: 0 } });
  assert.equal(bad.status, 400);
  assert.ok(bad.data.fields.title && bad.data.fields.method && bad.data.fields.duration_seconds);

  const unknown = await owner.call(`${ws()}/scene`, { method: 'POST', body: { title: 'x', hacker: 1 } });
  assert.equal(unknown.status, 400);
  assert.equal((await owner.call(`${ws()}/nonsense`, { method: 'POST', body: { title: 'x' } })).status, 404);
});

test('references must point at an item of the right kind in the same project', async () => {
  const scene = (await owner.call(`${ws()}/scene`, { method: 'POST', body: { title: 'Hook', duration_seconds: 5 } })).data.item;
  const foreignScene = (await owner.call(`${ws(otherPid)}/scene`, { method: 'POST', body: { title: 'Elsewhere' } })).data.item;
  const concept = (await owner.call(ws())).data.items.concept[0];

  assert.equal((await owner.call(`${ws()}/shot`, { method: 'POST', body: { title: 'S1', scene_id: foreignScene.id } })).status, 400);
  assert.equal((await owner.call(`${ws()}/shot`, { method: 'POST', body: { title: 'S1', scene_id: concept.id } })).status, 400);
  const shot = await owner.call(`${ws()}/shot`, { method: 'POST', body: { title: 'S1', scene_id: scene.id } });
  assert.equal(shot.status, 201);
});

test('items still referenced cannot be deleted; unlinking allows it', async () => {
  const { items } = (await owner.call(ws())).data;
  const scene = items.scene[0];
  const shot = items.shot[0];
  const blocked = await owner.call(`${ws()}/scene/${scene.id}`, { method: 'DELETE' });
  assert.equal(blocked.status, 409);
  assert.match(blocked.data.error, /1 shot/);
  await owner.call(`${ws()}/shot/${shot.id}`, { method: 'PATCH', body: { scene_id: null } });
  assert.equal((await owner.call(`${ws()}/scene/${scene.id}`, { method: 'DELETE' })).status, 200);
});

test('partial updates merge and keep other fields', async () => {
  const c = (await owner.call(ws())).data.items.concept[0];
  const r = await owner.call(`${ws()}/concept/${c.id}`, { method: 'PATCH', body: { status: 'selected' } });
  assert.equal(r.data.item.data.status, 'selected');
  assert.equal(r.data.item.data.hook, 'Every founder starts with an idea');
});

test('items can be reordered', async () => {
  for (const t of ['A', 'B', 'C']) await owner.call(`${ws()}/scene`, { method: 'POST', body: { title: t } });
  const titles = async () => (await owner.call(ws())).data.items.scene.map((s) => s.data.title);
  assert.deepEqual(await titles(), ['A', 'B', 'C']);
  const c = (await owner.call(ws())).data.items.scene[2];
  await owner.call(`${ws()}/scene/${c.id}/move`, { method: 'POST', body: { direction: 'up' } });
  assert.deepEqual(await titles(), ['A', 'C', 'B']);
  await owner.call(`${ws()}/scene/${c.id}/move`, { method: 'POST', body: { direction: 'up' } });
  await owner.call(`${ws()}/scene/${c.id}/move`, { method: 'POST', body: { direction: 'up' } }); // already first: no-op
  assert.deepEqual(await titles(), ['C', 'A', 'B']);
});

test('standard checklist is added once and ticking is audited', async () => {
  const first = await owner.call(`${ws()}/checklist/defaults`, { method: 'POST' });
  assert.equal(first.data.items.length, DEFAULT_CHECKLIST.length);
  const again = await owner.call(`${ws()}/checklist/defaults`, { method: 'POST' });
  assert.equal(again.data.items.length, DEFAULT_CHECKLIST.length);
  const item = first.data.items[0];
  await owner.call(`${ws()}/checklist/${item.id}`, { method: 'PATCH', body: { done: true } });
  const ev = (await owner.call(`/api/projects/${pid}/activity`)).data.events[0];
  assert.equal(ev.action, 'workspace.updated');
  assert.equal(ev.metadata.done, true);
});

test('reviewers can read but not write; outsiders get 404', async () => {
  assert.equal((await reviewer.call(ws())).status, 200);
  assert.equal((await reviewer.call(`${ws()}/scene`, { method: 'POST', body: { title: 'x' } })).status, 403);
  const s = (await owner.call(ws())).data.items.scene[0];
  assert.equal((await reviewer.call(`${ws()}/scene/${s.id}`, { method: 'PATCH', body: { title: 'x' } })).status, 403);
  assert.equal((await reviewer.call(`${ws()}/scene/${s.id}`, { method: 'DELETE' })).status, 403);
  assert.equal((await outsider.call(ws())).status, 404);
  assert.equal((await outsider.call(`${ws()}/scene/${s.id}`, { method: 'PATCH', body: { title: 'x' } })).status, 404);
});

test('an item id from another project cannot be edited through this project', async () => {
  const foreign = (await owner.call(ws(otherPid))).data.items.scene[0];
  assert.equal((await owner.call(`${ws()}/scene/${foreign.id}`, { method: 'PATCH', body: { title: 'x' } })).status, 404);
});
