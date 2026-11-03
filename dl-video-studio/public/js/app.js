// App shell and hash router.
import { h, LABELS } from './dom.js';
import { api, setCsrf, ApiError } from './api.js';
import { loginView } from './views/login.js';
import { dashboardView } from './views/dashboard.js';
import { projectFormView } from './views/project-form.js';
import { projectView } from './views/project.js';
import { plannedView } from './views/planned.js';

const root = document.getElementById('app');
const state = { user: null, options: null };

const NAV = [
  { href: '#/projects', label: 'Projects', match: /^\/projects/ },
  { href: '#/preview', label: 'Live preview', soon: 'M3', match: /^\/preview/ },
  { href: '#/review', label: 'Review Studio', soon: 'M4', match: /^\/review/ },
  { href: '#/assets', label: 'Asset library', soon: 'M6', match: /^\/assets/ },
  { href: '#/knowledge', label: 'Knowledge base', soon: 'M7', match: /^\/knowledge/ },
];

const ROUTES = [
  [/^\/projects\/?$/, () => dashboardView(ctx())],
  [/^\/projects\/new$/, () => projectFormView(ctx())],
  [/^\/projects\/([\w-]+)\/edit$/, (id) => projectFormView(ctx(), id)],
  [/^\/projects\/([\w-]+)(?:\/(concepts|script|shots|prompts|assets|checklist))?$/, (id, tab) => projectView(ctx(), id, tab)],
  [/^\/(preview|review|assets|knowledge)$/, (key) => plannedView(key)],
];

function ctx() {
  return { ...state, navigate, refreshUser };
}

export function navigate(path) {
  if (location.hash === `#${path}`) render();
  else location.hash = path;
}

async function refreshUser() {
  try {
    const s = await api('/api/session');
    state.user = s.user;
    setCsrf(s.csrf);
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 401)) throw err;
    state.user = null;
    setCsrf(null);
  }
}

function shell(content, path) {
  const logout = async () => {
    await api('/api/logout', { method: 'POST' });
    state.user = null;
    setCsrf(null);
    navigate('/projects');
  };
  return h('div', { class: 'shell' },
    h('aside', { class: 'sidebar' },
      h('div', { class: 'brand' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }),
        h('span', {}, 'DL Video Studio', h('small', {}, 'Internal · local'))),
      h('nav', { class: 'nav', 'aria-label': 'Main' },
        NAV.map((n) => h('a', { href: n.href, 'aria-current': n.match.test(path) ? 'page' : false },
          n.label, n.soon ? h('span', { class: 'soon', title: `Planned for milestone ${n.soon}` }, n.soon) : null))),
      h('div', { class: 'sidebar-foot' },
        h('strong', {}, state.user.name),
        h('div', {}, `${state.user.email} · ${state.user.systemRole === 'admin' ? 'Admin' : 'Member'}`),
        h('button', { class: 'btn ghost small pl-0', onclick: logout }, 'Sign out'))),
    h('main', { class: 'main', id: 'main' }, content));
}

async function render() {
  const path = location.hash.replace(/^#/, '') || '/projects';
  if (!state.user) {
    root.replaceChildren(loginView({ onSignedIn: (s) => { state.user = s.user; setCsrf(s.csrf); render(); } }));
    return;
  }
  let view = null;
  for (const [re, fn] of ROUTES) {
    const m = path.match(re);
    if (m) { view = fn(...m.slice(1)); break; }
  }
  if (!view) view = Promise.resolve(h('div', { class: 'empty' }, h('h2', {}, 'Page not found'), h('a', { href: '#/projects' }, 'Back to projects')));
  root.replaceChildren(shell(h('p', { class: 'muted' }, 'Loading…'), path));
  try {
    const el = await view;
    document.getElementById('main')?.replaceChildren(el);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) { state.user = null; render(); return; }
    document.getElementById('main')?.replaceChildren(h('div', { class: 'alert error', role: 'alert' }, err.message));
  }
  document.title = `${document.querySelector('#main h1')?.textContent || 'DL Video Studio'} · DL Video Studio`;
}

window.addEventListener('hashchange', render);
(async () => {
  [state.options] = await Promise.all([api('/api/options'), refreshUser()]);
  render();
})();

export { LABELS };
