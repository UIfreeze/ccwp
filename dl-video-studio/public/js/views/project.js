// Project overview: brief, production stage, team and activity log.
import { h, statusBadge, fmtDate, fmtDuration, LABELS } from '../dom.js';
import { api } from '../api.js';
import { workspaceTab } from './workspace.js';

export const TABS = [
  ['overview', 'Overview', null],
  ['concepts', 'Concepts', 'concept'],
  ['script', 'Script & storyboard', 'scene'],
  ['shots', 'Shot list', 'shot'],
  ['prompts', 'Prompts', 'prompt'],
  ['assets', 'Assets', 'asset'],
  ['checklist', 'Checklist', 'checklist'],
];
let schemaCache = null;

const PIPELINE = ['brief', 'concept', 'script', 'storyboard', 'production', 'review', 'approved', 'delivered'];

const ACTIONS = {
  'project.created': () => 'created the project',
  'project.updated': (m) => `updated ${m.fields.map((f) => f.replace(/_/g, ' ')).join(', ')}`,
  'project.status_changed': (m) => `moved the project from ${LABELS.status[m.status.from]} to ${LABELS.status[m.status.to]}`,
  'member.added': (m) => `added ${m.name} as ${LABELS.role[m.role]}`,
  'member.role_changed': (m) => `changed ${m.name} from ${LABELS.role[m.previous]} to ${LABELS.role[m.role]}`,
  'member.removed': (m) => `removed ${m.name}`,
  'workspace.created': (m) => `added ${KIND_NAMES[m.kind]} “${m.title}”`,
  'workspace.updated': (m) => (m.kind === 'checklist' && 'done' in m ? `${m.done ? 'ticked' : 'unticked'} “${m.title}”` : `edited ${KIND_NAMES[m.kind]} “${m.title}”`),
  'workspace.deleted': (m) => `deleted ${KIND_NAMES[m.kind]} “${m.title}”`,
  'workspace.checklist_added': (m) => `added the standard checklist (${m.added} items)`,
};
const KIND_NAMES = { concept: 'concept', scene: 'scene', shot: 'shot', prompt: 'prompt', asset: 'asset', checklist: 'checklist item' };

export async function projectView({ navigate }, id, tab = 'overview') {
  const [{ project: p }, { events }, { items }, schema] = await Promise.all([
    api(`/api/projects/${id}`), api(`/api/projects/${id}/activity`), api(`/api/projects/${id}/workspace`),
    schemaCache ?? api('/api/workspace-schema').then((r) => (schemaCache = r.schema)),
  ]);
  const container = h('div');
  const rerender = () => navigate(`/projects/${id}`);

  const idx = PIPELINE.indexOf(p.status);
  const pipeline = h('div', { class: 'pipeline', 'aria-label': 'Production stage' },
    PIPELINE.map((s, i) => h('span', { class: i < idx ? 'done' : i === idx ? 'current' : '' }, LABELS.status[s])));

  const rowsDef = [
    ['Objective', p.objective], ['Audience', p.audience], ['Core message', p.core_message], ['Call to action', p.cta],
    ['Platforms', p.platforms.map((x) => LABELS.platform[x]).join(', ')], ['Aspect ratios', p.aspect_ratios.join(', ')],
    ['Target duration', fmtDuration(p.duration_seconds)], ['Due date', fmtDate(p.due_date)], ['Final approver', p.approver],
    ['Constraints & claims', p.constraints], ['References', p.references_notes],
  ];
  const brief = h('dl', { class: 'brief' }, rowsDef.flatMap(([k, val]) => [h('dt', {}, k), h('dd', { class: val ? '' : 'muted' }, val || 'Not set')]));
  const missing = ['objective', 'audience', 'core_message', 'cta'].filter((k) => !p[k]);

  const members = h('ul', { class: 'members' }, p.members.map((m) => h('li', {},
    h('span', {}, m.name, h('span', { class: 'small muted' }, ` · ${m.email}`)),
    h('span', {}, h('span', { class: 'badge' }, LABELS.role[m.role]),
      p.permissions.manageMembers && m.role !== 'owner'
        ? h('button', { class: 'btn ghost danger small', 'aria-label': `Remove ${m.name}`, onclick: async () => {
          if (!confirm(`Remove ${m.name} from this project?`)) return;
          await api(`/api/projects/${id}/members/${m.id}`, { method: 'DELETE' });
          rerender();
        } }, 'Remove') : null))));

  let addForm = null;
  if (p.permissions.manageMembers) {
    const msg = h('div', { class: 'small error', role: 'alert', hidden: true });
    addForm = h('form', { class: 'inline-form', 'aria-label': 'Add member' },
      h('input', { type: 'email', name: 'email', placeholder: 'colleague@company.com', required: true, 'aria-label': 'Email' }),
      h('select', { name: 'role', 'aria-label': 'Role' }, ['editor', 'reviewer', 'viewer'].map((r) => h('option', { value: r }, LABELS.role[r]))),
      h('button', { class: 'btn', type: 'submit' }, 'Add'), msg);
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.hidden = true;
      try {
        await api(`/api/projects/${id}/members`, { method: 'POST', body: { email: addForm.email.value, role: addForm.role.value } });
        rerender();
      } catch (err) { msg.textContent = err.message; msg.hidden = false; }
    });
  }

  const activity = h('ul', { class: 'activity' }, events.length ? events.map((e) => h('li', {},
    h('span', {}, h('strong', {}, e.actor_name || 'System'), ' ', (ACTIONS[e.action] || (() => e.action))(e.metadata)),
    h('span', { class: 'small muted' }, fmtDate(e.created_at, true)))) : h('li', { class: 'muted' }, 'No activity yet.'));

  const tabs = h('nav', { class: 'tabs', 'aria-label': 'Project sections' }, TABS.map(([key, label, kind]) => {
    const n = kind ? items[kind].length : null;
    const doneN = kind === 'checklist' ? items.checklist.filter((i) => i.data.done).length : null;
    return h('a', { href: `#/projects/${id}${key === 'overview' ? '' : `/${key}`}`, 'aria-current': key === tab ? 'page' : false },
      label, n ? h('span', { class: 'count' }, kind === 'checklist' ? `${doneN}/${n}` : n) : null);
  }));

  const head = h('div', { class: 'page-head' },
      h('div', {}, h('h1', {}, p.name), h('p', {}, p.description || 'No description.')),
      h('div', { class: 'chips' }, statusBadge(p.status), h('span', { class: 'badge' }, `You: ${LABELS.role[p.my_role]}`),
        p.permissions.edit ? h('a', { class: 'btn', href: `#/projects/${id}/edit` }, 'Edit brief') : null));

  const kind = TABS.find(([k]) => k === tab)?.[2];
  if (kind) {
    const slot = h('div');
    const draw = (its) => slot.replaceChildren(workspaceTab({
      projectId: id, project: p, kind, schema, items: its, canEdit: p.permissions.edit,
      reload: async () => {
        const fresh = (await api(`/api/projects/${id}/workspace`)).items;
        draw(fresh);
        tabs.querySelectorAll('a').forEach((a, i) => {
          const k = TABS[i][2];
          if (!k) return;
          const n = fresh[k].length;
          a.querySelector('.count')?.remove();
          if (n) a.append(h('span', { class: 'count' }, k === 'checklist' ? `${fresh.checklist.filter((x) => x.data.done).length}/${n}` : n));
        });
      },
    }));
    draw(items);
    container.append(head, tabs, slot);
    return container;
  }

  container.append(head, tabs,
    pipeline,
    h('div', { class: 'detail' },
      h('section', { class: 'card', 'aria-labelledby': 'brief-h' },
        h('h2', { id: 'brief-h' }, 'Brief'),
        missing.length ? h('div', { class: 'alert info mb-4' },
          `The brief is missing: ${missing.map((k) => k.replace('_', ' ')).join(', ')}. Fill these in before concept work.`) : null,
        brief,
        h('div', { class: 'alert warn mt-4' },
          'Video uploads, timecoded comments and approvals arrive with DL Review Studio in Milestone 4.')),
      h('div', { class: 'stack' },
        h('section', { class: 'card', 'aria-labelledby': 'team-h' }, h('h2', { id: 'team-h' }, 'Team'), members, addForm),
        h('section', { class: 'card', 'aria-labelledby': 'act-h' }, h('h2', { id: 'act-h' }, 'Activity'), activity))));
  return container;
}
