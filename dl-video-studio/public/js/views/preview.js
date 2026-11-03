// Live preview hub: explains and links to Remotion Studio, which runs as its own local server.
import { h } from '../dom.js';

const STUDIO_URL = 'http://localhost:3000';

const FORMATS = [
  ['IdeaToPlan-4x5', '1080 × 1350', 'LinkedIn feed (primary)'],
  ['IdeaToPlan-9x16', '1080 × 1920', 'Instagram Reels / Shorts (primary)'],
  ['IdeaToPlan-1x1', '1080 × 1080', 'Square feed'],
  ['IdeaToPlan-16x9', '1920 × 1080', 'YouTube / website'],
];

const step = (n, title, body) => h('li', { class: 'step' }, h('span', { class: 'step-n', 'aria-hidden': 'true' }, n), h('div', {}, h('strong', {}, title), body));
const code = (text) => h('pre', { class: 'cmd' }, text);

export async function previewView() {
  return h('div', {},
    h('div', { class: 'page-head' },
      h('div', {}, h('h1', {}, 'Live preview'),
        h('p', {}, 'Code-built motion graphics and UI animation, previewed live in Remotion Studio. This is the creation preview — the full edit, colour and sound happen in DaVinci Resolve.')),
      h('a', { class: 'btn primary', href: STUDIO_URL, target: '_blank', rel: 'noopener' }, 'Open Remotion Studio ↗')),
    h('div', { class: 'detail' },
      h('section', { class: 'card stack', 'aria-labelledby': 'start-h' },
        h('h2', { id: 'start-h' }, 'Start the preview'),
        h('p', { class: 'muted' }, 'Remotion Studio runs separately from this app, in a second PowerShell window. Keep this app running in its own window.'),
        h('ol', { class: 'steps' },
          step(1, 'Open PowerShell in the remotion folder', h('p', { class: 'small muted' }, 'In File Explorer go into dl-video-studio → remotion, press Ctrl + L, type powershell and press Enter.')),
          step(2, 'First time only: install', code('npm install')),
          step(3, 'Start Studio', code('npm run dev')),
          step(4, 'Open it', h('p', { class: 'small muted' }, 'It opens in your browser automatically, or use the button above (', STUDIO_URL, ').'))),
        h('div', { class: 'alert info' },
          'In Studio, pick a format on the left, press play, and edit text, list items and colours in the right-hand panel. Turn on ', h('strong', {}, 'showSafeArea'), ' to check text stays clear of platform buttons. Use the save button that appears after an edit to keep it.')),
      h('div', { class: 'stack' },
        h('section', { class: 'card', 'aria-labelledby': 'fmt-h' },
          h('h2', { id: 'fmt-h' }, 'Sample: “Idea to plan” (22s)'),
          h('p', { class: 'small muted' }, 'Synthetic demo. Copy, colours and logo are placeholders until DL brand assets are supplied.'),
          h('ul', { class: 'members' }, FORMATS.map(([id, size, use]) => h('li', {}, h('span', {}, h('strong', {}, id), h('span', { class: 'small muted' }, ` · ${use}`)), h('span', { class: 'badge' }, size))))),
        h('section', { class: 'card', 'aria-labelledby': 'render-h' },
          h('h2', { id: 'render-h' }, 'Test export'),
          h('p', { class: 'small muted' }, 'Renders a half-size preview MP4 into dl-video-studio/exports. Final full-size exports follow an approved export plan.'),
          code('npm run render:test'),
          h('p', { class: 'small muted' }, 'The first render downloads Remotion’s own headless browser (about 100 MB, one time).')),
        h('div', { class: 'alert warn' },
          'Licence: Remotion is free for companies with up to 3 employees. Larger companies need a Remotion Company Licence before production use.'))));
}
