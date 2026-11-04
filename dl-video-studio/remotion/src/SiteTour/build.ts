import { CapturedPage, Tour } from "./types";

/** One keyframe of the tour camera. Times in seconds from the start of the tour segment. */
export type Key = {
  t: number; page: number; scroll: number; zoom: number; focusY: number;
  cx: number; cy: number; click?: boolean; caption?: string; sub?: string; hoverIdx?: number;
};

const VIEW_H = 900;
const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** Builds the guided-tour keyframes from REAL captured page data (nav, headings, CTAs). */
export const buildTour = (tour: Tour, maxPages: number, stopsPerPage: number) => {
  const pages = tour.pages.slice(0, maxPages);
  const keys: Key[] = [];
  let t = 0;
  let cur: Key = { t: 0, page: 0, scroll: 0, zoom: 1, focusY: 450, cx: 760, cy: 560 };
  const push = (dt: number, k: Partial<Key>) => {
    t += dt;
    cur = { ...cur, click: false, hoverIdx: undefined, ...k, t };
    keys.push(cur);
  };
  keys.push(cur);

  const maxScroll = (p: CapturedPage) => Math.max(0, p.height - VIEW_H);
  const stops = (p: CapturedPage, n: number) => {
    const hs = p.headings.filter((h) => h.level <= 2 && h.y > 380).sort((a, b) => a.y - b.y);
    const picked: typeof hs = [];
    for (const h of hs) if (!picked.length || h.y - picked[picked.length - 1].y > 520) picked.push(h);
    return picked.slice(0, n);
  };
  const tourStops = (p: CapturedPage, label: string, n: number) => {
    stops(p, n).forEach((h, i) => {
      const scroll = Math.min(maxScroll(p), Math.max(0, h.y - 170));
      push(0, { caption: clean(h.text), sub: `${label} · section ${i + 1}` }); // caption leads the move
      push(1.3, { scroll, zoom: 1, cx: Math.min(1300, h.x + Math.min(h.w, 600) * 0.6), cy: h.y - scroll + h.h + 40 });
      push(1.7, { zoom: 1.07, focusY: h.y - scroll + 120 });
    });
  };

  // 1. First impression of the homepage.
  const home = pages[0];
  const homeH1 = home.headings.find((h) => h.level === 1);
  push(0.4, { caption: homeH1 ? clean(homeH1.text) : home.title, sub: `Homepage · ${host(home.url)}` });
  push(1.8, {});

  // 2. Hover across the real main menu.
  const navItems = home.nav.filter((n, i, a) => a.findIndex((m) => m.text === n.text) === i).slice(0, 7);
  if (navItems.length) {
    const menu = navItems.map((n) => clean(n.text)).join(" · ");
    navItems.forEach((n, i) => push(i === 0 ? 0.8 : 0.55, { cx: n.x + n.w / 2, cy: n.y + n.h / 2, hoverIdx: i, caption: "The main menu", sub: menu }));
    push(0.5, {});
  }

  // 3. Scroll the homepage section by section.
  tourStops(home, "Homepage", Math.max(stopsPerPage, 3));
  push(1.4, { scroll: 0, zoom: 1, cx: 760, cy: 520, caption: undefined, sub: undefined });

  // 4. Visit each main page through its real menu item.
  pages.slice(1).forEach((p, i) => {
    const from = pages[i];
    const target = from.nav.find((n) => clean(n.text) === clean(p.navText || "")) || home.nav.find((n) => clean(n.text) === clean(p.navText || ""));
    if (target) {
      push(0.9, { cx: target.x + target.w / 2, cy: target.y + target.h / 2, hoverIdx: -1, caption: `Opening “${clean(p.navText || p.title)}”`, sub: "Click the menu item" });
      push(0.25, { click: true });
    }
    const h1 = p.headings.find((h) => h.level === 1);
    push(0.35, { page: i + 1, scroll: 0, zoom: 1, caption: clean(p.navText || p.title), sub: h1 ? clean(h1.text) : host(p.url) });
    push(1.6, {});
    tourStops(p, clean(p.navText || p.title), stopsPerPage);
    if (i < pages.length - 2) push(1.1, { scroll: 0, zoom: 1, caption: undefined, sub: undefined });
  });
  push(1.2, {});
  return { keys, duration: t, pages };
};

export const ctaFor = (tour: Tour) => {
  const all = tour.pages.flatMap((p) => p.ctas.map((c) => clean(c.text)));
  return all[0] ?? null;
};
export { host };
