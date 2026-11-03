// Generic editor for one workspace section, built from the server-provided field schema.
import { h, humanize, spokenSeconds, fmtDate } from '../dom.js';
import { api, ApiError } from '../api.js';

const ENUM_BADGE = { status: true, method: true, type: true, origin: true, licence_status: true, shot_size: true, aspect_ratio: true, category: true };

export function workspaceTab({ projectId, project, kind, schema, items, canEdit, reload }) {
  const s = schema[kind];
  const list = items[kind];
  const base = `/api/projects/${projectId}/workspace/${kind}`;
  const panel = h('div', { class: 'stack' });
  const notice = h('div', { class: 'alert error', role: 'alert', hidden: true });
  const showError = (err) => { notice.textContent = err.message; notice.hidden = false; notice.scrollIntoView({ block: 'nearest' }); };

  const refLabel = (refKind, id) => {
    const idx = items[refKind].findIndex((x) => x.id === id);
    if (idx < 0) return null;
    const it = items[refKind][idx];
    return `${schema[refKind].singular} ${idx + 1} · ${it.data[schema[refKind].titleField]}`;
  };

  // ---------- form ----------
  function form(item, onDone) {
    const fieldEls = {};
    const data = item?.data ?? {};
    const control = (f) => {
      const id = `f-${kind}-${item?.id ?? 'new'}-${f.key}`;
      const val = data[f.key] ?? f.default ?? '';
      let input;
      if (f.type === 'longtext') input = h('textarea', { id, name: f.key, rows: 3 }, val);
      else if (f.type === 'enum') {
        input = h('select', { id, name: f.key },
          f.required || f.default !== undefined ? null : h('option', { value: '' }, '—'),
          f.options.map((o) => h('option', { value: o, selected: o === val }, humanize(o))));
      } else if (f.type === 'ref') {
        input = h('select', { id, name: f.key }, h('option', { value: '' }, '— none —'),
          items[f.ref].map((r) => h('option', { value: r.id, selected: r.id === val }, refLabel(f.ref, r.id))));
      } else if (f.type === 'bool') {
        input = h('input', { id, name: f.key, type: 'checkbox', checked: Boolean(val) });
      } else {
        input = h('input', { id, name: f.key, type: f.type === 'int' ? 'number' : 'text', value: val, min: f.min, max: f.max, step: f.type === 'int' ? 1 : null, maxlength: f.max && f.type === 'text' ? f.max : null });
      }
      const err = h('div', { class: 'error', hidden: true });
      const wrap = h('div', { class: `field ${f.type === 'longtext' ? 'span-all' : ''}` },
        h('label', { for: id }, f.label, f.required ? ' *' : '', f.hint ? h('span', { class: 'hint' }, ` — ${f.hint}`) : null), input, err);
      fieldEls[f.key] = { wrap, err, f };
      return wrap;
    };
    const formError = h('div', { class: 'alert error', role: 'alert', hidden: true });
    const el = h('form', { class: 'card ws-form', novalidate: true },
      h('h3', {}, item ? `Edit ${s.singular.toLowerCase()}` : `New ${s.singular.toLowerCase()}`),
      h('div', { class: 'ws-grid' }, s.fields.map(control)),
      formError,
      h('div', { class: 'form-actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => onDone(false) }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'submit' }, item ? 'Save' : `Add ${s.singular.toLowerCase()}`)));
    el.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.hidden = true;
      for (const { wrap, err } of Object.values(fieldEls)) { wrap.classList.remove('invalid'); err.hidden = true; }
      const body = {};
      for (const { f } of Object.values(fieldEls)) {
        const input = el.elements[f.key];
        if (f.type === 'bool') body[f.key] = input.checked;
        else if (f.type === 'int') body[f.key] = input.value === '' ? null : Number(input.value);
        else if (f.type === 'enum' || f.type === 'ref') body[f.key] = input.value || null;
        else body[f.key] = input.value;
      }
      try {
        await api(item ? `${base}/${item.id}` : base, { method: item ? 'PATCH' : 'POST', body });
        onDone(true);
      } catch (err) {
        formError.textContent = err.message;
        formError.hidden = false;
        if (err instanceof ApiError) {
          for (const [k, msg] of Object.entries(err.fields)) {
            const fe = fieldEls[k];
            if (fe) { fe.wrap.classList.add('invalid'); fe.err.textContent = msg; fe.err.hidden = false; }
          }
        }
      }
    });
    queueMicrotask(() => el.querySelector('input, textarea, select')?.focus());
    return el;
  }

  // ---------- read-only card ----------
  function card(item, index) {
    const d = item.data;
    const badges = s.fields.filter((f) => f.type === 'enum' && ENUM_BADGE[f.key] && d[f.key])
      .map((f) => h('span', { class: `badge v-${d[f.key]}` }, humanize(d[f.key])));
    const refs = s.fields.filter((f) => f.type === 'ref' && d[f.key])
      .map((f) => h('span', { class: 'chip' }, `${f.key === 'shot_id' && kind === 'asset' ? 'Used in ' : ''}${refLabel(f.ref, d[f.key]) ?? `${f.label}: missing`}`));
    const rows = s.fields.filter((f) => !['enum', 'ref', 'bool'].includes(f.type) && f.key !== s.titleField && d[f.key] !== null && d[f.key] !== undefined && d[f.key] !== '');
    const extra = kind === 'scene' ? sceneTiming(d) : kind === 'prompt' ? composedPrompt(d) : null;

    const actions = canEdit ? h('div', { class: 'ws-actions' },
      h('button', { class: 'btn small ghost', 'aria-label': 'Move up', disabled: index === 0, onclick: () => move(item, 'up') }, '↑'),
      h('button', { class: 'btn small ghost', 'aria-label': 'Move down', disabled: index === list.length - 1, onclick: () => move(item, 'down') }, '↓'),
      h('button', { class: 'btn small', onclick: () => edit(item, cardEl) }, 'Edit'),
      h('button', { class: 'btn small ghost danger', onclick: () => remove(item) }, 'Delete')) : null;

    const cardEl = h('article', { class: 'card ws-card', id: `item-${item.id}` },
      h('header', { class: 'ws-head' },
        h('div', {}, h('h3', {}, h('span', { class: 'ws-num' }, `${index + 1}`), d[s.titleField]),
          h('div', { class: 'chips' }, badges, refs)),
        actions),
      rows.length ? h('dl', { class: 'brief compact' }, rows.flatMap((f) => [h('dt', {}, f.label), h('dd', {}, f.type === 'int' && f.key.includes('duration') ? `${d[f.key]}s` : d[f.key])])) : null,
      extra,
      h('p', { class: 'small muted ws-foot' }, `Updated ${fmtDate(item.updated_at, true)}${item.updated_by_name ? ` by ${item.updated_by_name}` : ''}`));
    return cardEl;
  }

  function sceneTiming(d) {
    const { words, seconds } = spokenSeconds(d.voiceover);
    if (!words) return null;
    const over = d.duration_seconds && seconds > d.duration_seconds;
    return h('p', { class: `small ws-timing ${over ? 'timing-warn' : 'muted'}` },
      `Voiceover: ${words} words ≈ ${seconds}s spoken at ~150 wpm`,
      over ? ` — longer than the ${d.duration_seconds}s scene. Trim the copy or extend the scene.` : '');
  }

  function composedPrompt(d) {
    const parts = [d.subject, d.action, d.setting, d.camera && `Camera: ${d.camera}`, d.light && `Lighting: ${d.light}`,
      d.style && `Style: ${d.style}`, d.composition && `Composition: ${d.composition}`, d.audio && `Audio: ${d.audio}`,
      d.continuity && `Continuity: ${d.continuity}`].filter(Boolean).map((x) => x.trim().replace(/[.\s]+$/, '') + '.');
    if (d.avoid) parts.push(`Avoid: ${d.avoid.trim().replace(/[.\s]+$/, '')}.`);
    if (!parts.length) return null;
    const text = parts.join(' ');
    const output = [d.tool, d.aspect_ratio, d.duration_seconds && `${d.duration_seconds}s`, d.outputs && `${d.outputs} output${d.outputs > 1 ? 's' : ''}`].filter(Boolean).join(' · ');
    const copyBtn = h('button', { class: 'btn small', type: 'button' }, 'Copy prompt');
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text); copyBtn.textContent = 'Copied'; } catch { copyBtn.textContent = 'Select and copy manually'; }
      setTimeout(() => { copyBtn.textContent = 'Copy prompt'; }, 2000);
    });
    return h('div', { class: 'composed' },
      h('div', { class: 'composed-head' }, h('strong', {}, 'Composed prompt'), copyBtn),
      h('pre', {}, text),
      output ? h('p', { class: 'small muted' }, `Output: ${output}`) : null,
      h('p', { class: 'small gate' }, 'Before generating in any paid tool: show the exact model, settings, prompt and displayed credit cost, and get a separate approval for this one generation.'));
  }

  // ---------- actions ----------
  const add = () => {
    const f = form(null, async (saved) => { f.remove(); addBtn.disabled = false; if (saved) await reload(); });
    addBtn.disabled = true;
    listEl.before(f);
  };
  const edit = (item, cardEl) => {
    const f = form(item, async (saved) => { if (saved) await reload(); else f.replaceWith(cardEl); });
    cardEl.replaceWith(f);
  };
  const move = async (item, direction) => {
    try { await api(`${base}/${item.id}/move`, { method: 'POST', body: { direction } }); await reload(); } catch (err) { showError(err); }
  };
  const remove = async (item) => {
    if (!confirm(`Delete “${item.data[s.titleField]}”? This can’t be undone.`)) return;
    try { await api(`${base}/${item.id}`, { method: 'DELETE' }); await reload(); } catch (err) { showError(err); }
  };

  const addBtn = h('button', { class: 'btn primary', onclick: add, hidden: !canEdit }, `+ Add ${s.singular.toLowerCase()}`);
  const listEl = kind === 'checklist' ? checklist() : h('div', { class: 'stack' },
    list.length ? list.map(card) : h('div', { class: 'empty small' }, `No ${s.label.toLowerCase()} yet.`, canEdit ? ' Use the button above to add the first one.' : ''));

  function checklist() {
    const groups = schema.checklist.fields.find((f) => f.key === 'category').options;
    if (!list.length) {
      return h('div', { class: 'empty' }, h('p', {}, 'No checklist yet.'),
        canEdit ? h('button', { class: 'btn primary', onclick: async () => {
          try { await api(`/api/projects/${projectId}/workspace/checklist/defaults`, { method: 'POST' }); await reload(); } catch (err) { showError(err); }
        } }, 'Add the standard DL checklist') : null);
    }
    const done = list.filter((i) => i.data.done).length;
    return h('div', { class: 'stack' },
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': list.length, 'aria-valuenow': done, 'aria-label': 'Checklist progress' },
        h('div', { class: `progress-fill w-${Math.round((done / list.length) * 20) * 5}` })),
      h('p', { class: 'small muted' }, `${done} of ${list.length} done`),
      groups.filter((g) => list.some((i) => i.data.category === g)).map((g) => h('section', { class: 'card' },
        h('h3', {}, humanize(g)),
        h('ul', { class: 'checklist' }, list.filter((i) => i.data.category === g).map((i) => {
          const box = h('input', { type: 'checkbox', id: `chk-${i.id}`, checked: Boolean(i.data.done), disabled: !canEdit });
          box.addEventListener('change', async () => {
            try { await api(`${base}/${i.id}`, { method: 'PATCH', body: { done: box.checked } }); await reload(); } catch (err) { box.checked = !box.checked; showError(err); }
          });
          return h('li', { class: i.data.done ? 'done' : '' }, box, h('label', { for: `chk-${i.id}` }, i.data.label),
            canEdit ? h('button', { class: 'btn small ghost danger', 'aria-label': `Delete ${i.data.label}`, onclick: () => remove(i) }, '×') : null);
        })))));
  }

  // Script-level timing summary against the brief's target duration.
  let summary = null;
  if (kind === 'scene' && list.length) {
    const total = list.reduce((a, x) => a + (x.data.duration_seconds || 0), 0);
    const vo = list.reduce((a, x) => a + spokenSeconds(x.data.voiceover).seconds, 0);
    const target = project.duration_seconds;
    const off = target && total && Math.abs(total - target) > Math.max(2, target * 0.1);
    summary = h('div', { class: `alert ${off ? 'warn' : 'info'}` },
      `${list.length} scene${list.length > 1 ? 's' : ''} · planned ${total || 0}s · voiceover ≈ ${vo}s spoken`,
      target ? ` · brief target ${target}s` : '', off ? ' — planned length is more than 10% away from the target.' : '');
  }

  panel.append(...[
    h('div', { class: 'ws-intro' }, h('p', { class: 'muted' }, s.intro), kind === 'checklist' && list.length && canEdit ? addBtn : kind !== 'checklist' ? addBtn : null),
    !canEdit ? h('div', { class: 'alert info' }, 'Read-only: your role on this project can view but not edit.') : null,
    summary, notice, listEl].filter(Boolean));
  return panel;
}
