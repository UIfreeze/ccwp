// Captures a REAL website for the SiteTour composition: full-page screenshots of the homepage and its
// main nav pages, a mobile view, and the real nav items / headings / CTAs with their positions.
// Usage: node scripts/capture-site.mjs https://www.decipheringlogic.com [maxPages=7]
// Output: public/site/tour.json + public/site/*.png  (git-ignored: captures are regenerated, not committed)
// Needs Playwright (`npm i -D playwright@1.56.1 && npx playwright install chromium` on your own machine).
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const START = process.argv[2];
const MAX_PAGES = Number(process.argv[3] || 7);
if (!START) { console.error("Usage: node scripts/capture-site.mjs <url> [maxPages]"); process.exit(1); }

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "site");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const VIEW = { width: 1440, height: 900 };
const DPR = 1.5;
const MAX_H = 14000; // cap very long pages (css px)

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DPR, reducedMotion: "no-preference" });
const page = await ctx.newPage();

/** Scroll the whole page slowly so lazy images and scroll-reveal animations fire, then return to the top. */
const primePage = async () => {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 250)); }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 600));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 800));
  });
  // Hide cookie banners / chat widgets that would cover content, without touching page content.
  await page.addStyleTag({ content: "[id*=cookie i],[class*=cookie i],[id*=consent i],[class*=consent i],iframe[src*=chat],[id*=intercom],[class*=crisp]{display:none!important}" }).catch(() => {});
};

const extract = async () => page.evaluate(() => {
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 4 && r.height > 4 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0"; };
  const text = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  const header = document.querySelector("header, nav, [role=navigation]");
  const nav = header ? [...header.querySelectorAll("a, button")].filter(visible).map((a) => ({ text: text(a), href: a.href || null, ...rect(a) })).filter((n) => n.text && n.text.length < 40 && n.y < 200) : [];
  const headings = [...document.querySelectorAll("h1, h2, h3")].filter(visible).map((h) => ({ level: Number(h.tagName[1]), text: text(h), ...rect(h) })).filter((h) => h.text && h.text.length < 140);
  const ctaRe = /contact|book|get started|start|call|quote|talk|let.?s|schedule|enquir|hire|work with/i;
  const ctas = [...document.querySelectorAll("a, button")].filter(visible).map((a) => ({ text: text(a), href: a.href || null, ...rect(a) })).filter((c) => c.text && c.text.length < 40 && ctaRe.test(c.text));
  const footer = document.querySelector("footer");
  const hdr = document.querySelector("header") || header;
  const pos = hdr ? getComputedStyle(hdr).position : "static";
  return {
    title: document.title,
    height: Math.min(document.documentElement.scrollHeight, 14000),
    nav, headings, ctas,
    headerSticky: pos === "fixed" || pos === "sticky",
    headerHeight: hdr ? Math.round(hdr.getBoundingClientRect().height) : 0,
    footer: footer ? { text: text(footer).slice(0, 600), ...rect(footer) } : null,
  };
});

const shoot = async (name, url) => {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => page.goto(url, { waitUntil: "load", timeout: 60000 }));
  await page.waitForTimeout(1500);
  await primePage();
  const meta = await extract();
  // "Above the fold" first impression, then the full page (capped).
  await page.screenshot({ path: join(OUT, `${name}-fold.png`) });
  await page.screenshot({ path: join(OUT, `${name}-full.png`), fullPage: true, clip: { x: 0, y: 0, width: VIEW.width, height: Math.min(meta.height, MAX_H) } });
  console.log(`captured ${name}: ${url} (${meta.height}px, ${meta.headings.length} headings)`);
  return { name, url: page.url(), image: `site/${name}-full.png`, fold: `site/${name}-fold.png`, width: VIEW.width, dpr: DPR, ...meta };
};

const home = await shoot("home", START);
const origin = new URL(home.url).origin;
const seen = new Set([home.url.replace(/\/$/, "")]);
const targets = home.nav.filter((n) => n.href && n.href.startsWith(origin) && !n.href.includes("#")).filter((n) => {
  const k = n.href.replace(/\/$/, ""); if (seen.has(k)) return false; seen.add(k); return true;
}).slice(0, MAX_PAGES - 1);
const pages = [home];
for (const [i, n] of targets.entries()) pages.push({ ...(await shoot(`p${i + 1}`, n.href)), navText: n.text });

// Mobile first impression.
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const mpage = await mctx.newPage();
await mpage.goto(START, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await mpage.waitForTimeout(2000);
await mpage.screenshot({ path: join(OUT, "mobile-fold.png") });

writeFileSync(join(OUT, "tour.json"), JSON.stringify({ site: origin, capturedAt: new Date().toISOString(), viewport: VIEW, mobile: "site/mobile-fold.png", pages }, null, 2));
console.log(`Wrote ${join(OUT, "tour.json")} with ${pages.length} pages`);
await browser.close();
