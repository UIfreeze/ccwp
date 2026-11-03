import { h, statusBadge, fmtDate, fmtDuration, LABELS } from '../dom.js';
import { api } from '../api.js';

const ACTIVE = ['brief', 'concept', 'script', 'storyboard', 'production'];

export async function dashboardView() {
  const { projects } = await api('/api/projects');
  const visible = projects.filter((p) => p.status !== 'archived');
  const count = (pred) => visible.filter(pred).length;
  const header = h('div', { class: 'page-head' },
    h('div', {}, h('h1', {}, 'Projects'), h('p', {}, 'Every video from brief to delivery. Only projects you are a member of are shown.')),
    h('a', { class: 'btn primary', href: '#/projects/new' }, '+ New project'));

  if (!projects.length) {
    return h('div', {}, header, h('div', { class: 'empty' },
      h('h2', {}, 'No projects yet'),
      h('p', {}, 'Start with a brief: objective, audience, platforms and the one message the video must land.'),
      h('a', { class: 'btn primary', href: '#/projects/new' }, 'Create the first project')));
  }

  const stats = h('div', { class: 'stats' },
    stat(count((p) => ACTIVE.includes(p.status)), 'In production'),
    stat(count((p) => p.status === 'review'), 'In review'),
    stat(count((p) => p.status === 'approved'), 'Approved'),
    stat(count((p) => p.status === 'delivered'), 'Delivered'));

  const archived = projects.length - visible.length;
  return h('div', {}, header, stats,
    h('div', { class: 'project-list' }, visible.map(row)),
    archived ? h('p', { class: 'small muted mt-3' }, `${archived} archived project(s) hidden.`) : null);
}

const stat = (n, l) => h('div', { class: 'stat' }, h('div', { class: 'n' }, n), h('div', { class: 'l' }, l));

function row(p) {
  return h('a', { class: 'project-row', href: `#/projects/${p.id}` },
    h('div', {},
      h('h3', {}, p.name, p.name.startsWith('[DEMO]') ? h('span', { class: 'badge demo ml-2' }, 'Synthetic') : null),
      h('div', { class: 'meta' },
        h('span', {}, `Owner: ${p.owner_name}`),
        h('span', {}, `Duration: ${fmtDuration(p.duration_seconds)}`),
        h('span', {}, `Due: ${fmtDate(p.due_date)}`),
        h('span', {}, `Last activity: ${fmtDate(p.last_activity, true)}`)),
      h('div', { class: 'chips mt-2' },
        p.aspect_ratios.map((a) => h('span', { class: 'chip' }, a)),
        p.platforms.map((x) => h('span', { class: 'chip' }, LABELS.platform[x] || x)))),
    statusBadge(p.status));
}
