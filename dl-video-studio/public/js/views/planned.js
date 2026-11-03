import { h } from '../dom.js';

const PLANNED = {
  review: {
    title: 'DL Review Studio', milestone: 'Milestone 4',
    body: 'In-house review: browser video player with visible timecode, timestamped comments and replies, immutable versions, version switching, approval states and an audit trail.',
    blocked: null,
  },
  assets: {
    title: 'Asset library', milestone: 'Milestone 6',
    body: 'Uploads with validated file types, provenance and licence notes, FFmpeg metadata and thumbnails, and project usage history.',
    blocked: null,
  },
  knowledge: {
    title: 'Knowledge base', milestone: 'Milestone 7',
    body: 'Reference register, technique cards, experiment log and weekly learning reports. The starting register lives in docs/REFERENCE_REGISTER.md.',
    blocked: null,
  },
};

export async function plannedView(key) {
  const p = PLANNED[key];
  return h('div', {},
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, p.title), h('p', {}, `Not built yet — planned for ${p.milestone}.`))),
    h('div', { class: 'card stack' },
      h('p', {}, p.body),
      p.blocked ? h('div', { class: 'alert warn' }, p.blocked) : null));
}
