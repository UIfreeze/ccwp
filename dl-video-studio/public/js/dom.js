// Tiny element builder. All user-supplied text goes through textContent, never innerHTML.
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const LABELS = {
  status: {
    brief: 'Brief', concept: 'Concept', script: 'Script', storyboard: 'Storyboard', production: 'Production',
    review: 'In review', approved: 'Approved', delivered: 'Delivered', archived: 'Archived',
  },
  platform: {
    linkedin: 'LinkedIn', instagram: 'Instagram', youtube_shorts: 'YouTube Shorts', youtube: 'YouTube',
    tiktok: 'TikTok', website: 'Website', other: 'Other',
  },
  role: { admin: 'Admin', owner: 'Owner', editor: 'Editor', reviewer: 'Reviewer', viewer: 'Viewer' },
};

export const statusBadge = (s) => h('span', { class: `badge s-${s}` }, LABELS.status[s] || s);

export function fmtDate(iso, withTime = false) {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleString(undefined, withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDuration(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}

const WORD_FIX = { '3d': '3D', ui: 'UI', sfx: 'SFX', qa: 'QA', ai: 'AI', cta: 'CTA' };
/** 'medium_close_up' → 'Medium close up', 'ai_video' → 'AI video'. */
export function humanize(value) {
  if (value === null || value === undefined || value === '') return '';
  const words = String(value).split('_').map((w) => WORD_FIX[w] || w);
  const first = words[0];
  words[0] = first === first.toUpperCase() ? first : first[0].toUpperCase() + first.slice(1);
  return words.join(' ');
}

/** Spoken-word estimate at ~150 words per minute (2.5 words/second). */
export function spokenSeconds(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return { words, seconds: Math.ceil(words / 2.5) };
}
