// Guided project intake (new) and brief editing (existing). Same form, different submit.
import { h, LABELS } from '../dom.js';
import { api, ApiError } from '../api.js';

const TEXT = [
  { section: 'Basics', fields: [
    ['name', 'Project name', 'input', 'Short and specific, e.g. “Blueprint explainer — LinkedIn launch”.'],
    ['description', 'Description', 'textarea', 'What is this video, in one or two sentences?'],
  ] },
  { section: 'Strategy', fields: [
    ['objective', 'Business objective', 'textarea', 'What should change after someone watches it?'],
    ['audience', 'Audience', 'textarea', 'Who exactly is this for? What do they already believe?'],
    ['core_message', 'Single core message', 'input', 'The one idea the viewer must remember.'],
    ['cta', 'Call to action', 'input', 'What should the viewer do next?'],
  ] },
];
const LATER = [
  ['constraints', 'Constraints, claims and brand rules', 'Facts that must be verified, mandatory brand assets, things to avoid.'],
  ['references_notes', 'References', 'Describe references and what to learn from each. Do not paste private links you would not want stored here.'],
];

export async function projectFormView({ options, navigate }, id) {
  const existing = id ? (await api(`/api/projects/${id}`)).project : null;
  if (existing && !existing.permissions.edit) {
    return h('div', { class: 'alert error' }, 'Your role on this project is read-only.');
  }
  const v = (k, d = '') => existing?.[k] ?? d;
  const errorBox = h('div', { class: 'alert error', role: 'alert', hidden: true });
  const fieldEls = {};

  const field = (name, label, kind, hint, extra = {}) => {
    const input = kind === 'textarea'
      ? h('textarea', { id: name, name, ...extra }, v(name))
      : h('input', { id: name, name, type: extra.type || 'text', value: v(name) ?? '', ...extra });
    const err = h('div', { class: 'error', id: `${name}-err`, hidden: true });
    const wrap = h('div', { class: 'field' }, h('label', { for: name }, label, hint ? h('span', { class: 'hint' }, ` — ${hint}`) : null), input, err);
    fieldEls[name] = { wrap, err };
    return wrap;
  };
  const checks = (name, legend, values, labeler) => {
    const selected = new Set(v(name, []));
    const err = h('div', { class: 'error', hidden: true });
    const wrap = h('fieldset', { class: 'field' }, h('legend', {}, legend),
      h('div', { class: 'checks' }, values.map((x) => h('label', {},
        h('input', { type: 'checkbox', name, value: x, checked: selected.has(x) }), labeler(x)))), err);
    fieldEls[name] = { wrap, err };
    return wrap;
  };

  const form = h('form', { class: 'card', novalidate: true },
    TEXT.map((s) => h('div', { class: 'form-section stack' }, h('h2', {}, s.section),
      s.fields.map(([n, l, k, hint]) => field(n, l, k, hint, n === 'name' ? { required: true, maxlength: 120 } : {})))),
    h('div', { class: 'form-section stack' }, h('h2', {}, 'Delivery'),
      checks('platforms', 'Platforms', options.platforms, (x) => LABELS.platform[x] || x),
      checks('aspect_ratios', 'Aspect ratios', options.aspectRatios, (x) => x),
      h('div', { class: 'grid cols-3' },
        field('duration_seconds', 'Target duration (seconds)', 'input', null, { type: 'number', min: 1, max: 7200, step: 1 }),
        field('due_date', 'Due date', 'input', null, { type: 'date' }),
        field('approver', 'Final approver', 'input', null)),
      existing ? h('div', { class: 'field' }, h('label', { for: 'status' }, 'Stage'),
        h('select', { id: 'status', name: 'status' }, options.statuses
          .filter((s) => s !== 'archived' || existing.permissions.archive)
          .map((s) => h('option', { value: s, selected: s === existing.status }, LABELS.status[s])))) : null),
    h('div', { class: 'form-section stack' }, h('h2', {}, 'Guardrails & references'),
      LATER.map(([n, l, hint]) => field(n, l, 'textarea', hint))),
    errorBox,
    h('div', { class: 'form-actions' },
      h('a', { class: 'btn', href: existing ? `#/projects/${id}` : '#/projects' }, 'Cancel'),
      h('button', { class: 'btn primary', type: 'submit' }, existing ? 'Save brief' : 'Create project')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    for (const { wrap, err } of Object.values(fieldEls)) { wrap.classList.remove('invalid'); err.hidden = true; }
    errorBox.hidden = true;
    const fd = new FormData(form);
    const body = {};
    for (const s of TEXT) for (const [n] of s.fields) body[n] = fd.get(n) || '';
    for (const [n] of LATER) body[n] = fd.get(n) || '';
    body.approver = fd.get('approver') || '';
    body.platforms = fd.getAll('platforms');
    body.aspect_ratios = fd.getAll('aspect_ratios');
    const dur = fd.get('duration_seconds');
    body.duration_seconds = dur ? Number(dur) : null;
    body.due_date = fd.get('due_date') || null;
    if (existing) body.status = fd.get('status');
    try {
      const { project } = existing
        ? await api(`/api/projects/${id}`, { method: 'PATCH', body })
        : await api('/api/projects', { method: 'POST', body });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.hidden = false;
      if (err instanceof ApiError) {
        for (const [n, msg] of Object.entries(err.fields)) {
          const f = fieldEls[n];
          if (!f) continue;
          f.wrap.classList.add('invalid');
          f.err.textContent = msg;
          f.err.hidden = false;
        }
        form.querySelector('.invalid input, .invalid textarea')?.focus();
      }
    }
  });

  return h('div', {},
    h('div', { class: 'page-head' }, h('div', {},
      h('h1', {}, existing ? 'Edit brief' : 'New project'),
      h('p', {}, existing ? existing.name : 'Capture the brief first. Everything downstream — concept, script, storyboard, review — builds on it.'))),
    form);
}
